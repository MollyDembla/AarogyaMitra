/**
 * AarogyaMitra LangGraph — Orchestrator Execution Engine (Runner)
 *
 * Coordinates execution of the LangGraph StateGraph, manages persistence in
 * MongoDB (AgentJourney, AgentResult), handles Human-In-The-Loop (HITL)
 * pause & resume, and logs state transitions.
 *
 * NO REDIS / NO BULLMQ — Pure LangGraph StateGraph Orchestration.
 */

import { getWellnessGraph } from './graph.js';
import AgentJourney from '../models/AgentJourney.js';
import AgentResult from '../models/AgentResult.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory active graph session checkpoint cache for quick resume
const sessionCheckpoints = new Map();

/**
 * Helper to initialize or load initial graph state
 */
export function createInitialState(sessionId, userId, userName, assessmentData, assessmentId = null) {
  const sid = sessionId || `lg_session_${Date.now()}_${uuidv4().substring(0, 8)}`;
  return {
    sessionId: sid,
    userId: userId?.toString() || null,
    userName: userName || 'User',
    assessmentData: assessmentData || {},
    assessmentId: assessmentId || null,

    // Assessment outputs
    mmwbi: null,
    riskLevel: null,
    userFacingRiskLabel: null,
    domainScores: {},
    psychometricScores: {},
    rawFeaturePayload: {},
    attentionFlags: [],
    safetyFlags: [],
    primaryConcerns: [],
    strengths: [],
    wellnessResultId: null,

    // Agent outputs
    recoveryWellness: null,
    physicalActivity: null,
    psychologicalSupport: null,
    careNavigation: null,
    wellnessPlan: null,

    // Orchestration metadata
    activeAgent: 'wellness_assessment',
    completedAgents: [],
    pendingAgents: [],
    recommendations: [],
    detectedFlags: [],
    triggeredEvents: [],
    highRiskDetected: false,
    crisisDetected: false,
    nextAction: null,
    routerDecision: null,
    journeyStatus: 'in_progress',

    // Human-in-the-loop state
    requiresUserAction: false,
    userActionType: null,
    userActionPayload: null,
    userActionResult: null,

    // Loop & control flow trackers
    iterationCount: 0,
    maxIterations: 8,
    reassessmentCount: 0,

    journeyId: null,
    checkpointData: null,
    error: null,
    lastError: null,
    failedNode: null
  };
}

/**
 * Runs or resumes the LangGraph StateGraph.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Unique session ID
 * @param {string} params.userId - User ID
 * @param {string} params.userName - User's name
 * @param {Object} params.assessmentData - Form responses or assessment payload
 * @param {Object} params.userActionResult - Result submitted by user if resuming HITL
 * @returns {Promise<Object>} Final state of the graph execution
 */
export async function runLangGraphWorkflow({
  sessionId,
  userId,
  userName,
  assessmentData,
  assessmentId = null,
  wellnessResultId = null,
  userActionResult = null
}) {
  const sid = sessionId || `lg_session_${Date.now()}_${uuidv4().substring(0, 8)}`;
  logger.info(`[LANGGRAPH RUNNER] Starting workflow for session ${sid}`);

  // Retrieve cached state or initialize fresh
  let state = sessionCheckpoints.get(sid);

  if (!state) {
    state = createInitialState(sid, userId, userName, assessmentData, assessmentId);
    if (wellnessResultId) state.wellnessResultId = wellnessResultId;
  }

  // If resuming with user action result
  if (userActionResult) {
    logger.info(`[LANGGRAPH RUNNER] Injecting user action result into session ${sid}:`, userActionResult);
    state.userActionResult = userActionResult;
    state.requiresUserAction = false;
    state.userActionType = null;
  }

  // Check or create AgentJourney record in MongoDB
  let journey = null;
  if (state.journeyId) {
    journey = await AgentJourney.findById(state.journeyId);
  }

  if (!journey && userId) {
    journey = await AgentJourney.create({
      user: userId,
      currentAgent: 'Recovery and Wellness Agent',
      status: 'in_progress',
      completedAgents: [],
      steps: []
    });
    state.journeyId = journey._id.toString();
  }

  // Get compiled graph
  const graph = getWellnessGraph();

  try {
    logger.info(`[LANGGRAPH RUNNER] Invoking StateGraph for session ${sid}...`);

    // Execute graph state transitions
    const finalState = await graph.invoke(state);

    // Update in-memory checkpoint cache
    sessionCheckpoints.set(sid, finalState);

    // Sync to Mongo AgentJourney
    if (journey) {
      journey.completedAgents = finalState.completedAgents || [];
      if (finalState.requiresUserAction) {
        journey.status = 'in_progress';
        journey.recommendationReason = `Awaiting user action: ${finalState.userActionType}`;
      } else if (finalState.wellnessPlan || finalState.activeAgent === 'END') {
        journey.status = 'completed';
        journey.recommendationReason = 'Multi-agent wellness plan generated successfully.';
      }
      await journey.save();
    }

    logger.info(`[LANGGRAPH RUNNER] Workflow step completed. Active agent: ${finalState.activeAgent}, Status: ${finalState.journeyStatus}, UserActionRequired: ${finalState.requiresUserAction}`);

    return {
      success: true,
      sessionId: sid,
      state: finalState,
      requiresUserAction: finalState.requiresUserAction,
      userActionType: finalState.userActionType,
      userActionPayload: finalState.userActionPayload,
      activeAgent: finalState.activeAgent,
      completedAgents: finalState.completedAgents,
      wellnessPlan: finalState.wellnessPlan,
      routerDecision: finalState.routerDecision
    };
  } catch (err) {
    logger.error(`[LANGGRAPH RUNNER] Error running graph for session ${sid}:`, err);

    state.error = err.message;
    state.journeyStatus = 'failed';
    sessionCheckpoints.set(sid, state);

    if (journey) {
      journey.status = 'in_progress';
      await journey.save();
    }

    return {
      success: false,
      sessionId: sid,
      error: err.message,
      state
    };
  }
}

/**
 * Resumes a paused LangGraph workflow with user input (HITL).
 */
export async function resumeLangGraphWorkflow(sessionId, userActionResult, userId) {
  return runLangGraphWorkflow({
    sessionId,
    userId,
    userActionResult
  });
}

/**
 * Retrieves current checkpoint state for a session
 */
export function getSessionState(sessionId) {
  return sessionCheckpoints.get(sessionId) || null;
}
