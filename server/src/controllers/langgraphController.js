import { runLangGraphWorkflow, resumeLangGraphWorkflow, getSessionState } from '../langgraph/runner.js';
import { apiResponse } from '../utils/apiResponse.js';
import AgentJourney from '../models/AgentJourney.js';
import AgentExecution from '../models/AgentExecution.js';
import AgentEvent from '../models/AgentEvent.js';
import WellnessSession from '../models/WellnessSession.js';
import WellnessPlan from '../models/WellnessPlan.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controller to start a new LangGraph session or execute an evaluation step
 */
export const runGraphSession = async (req, res, next) => {
  try {
    const { sessionId, assessmentData, assessmentId } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || req.user.email || 'User';
    const sid = sessionId || `lg_session_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Log session start in MongoDB
    try {
      let sessionDoc = await WellnessSession.findOne({ sessionId: sid });
      if (!sessionDoc) {
        sessionDoc = await WellnessSession.create({
          sessionId: sid,
          user: userId,
          status: 'in_progress',
          currentAgent: 'wellness_assessment'
        });
      }
    } catch (sErr) {
      console.warn('Session persistence warning:', sErr.message);
    }

    const result = await runLangGraphWorkflow({
      sessionId: sid,
      userId,
      userName,
      assessmentData,
      assessmentId
    });

    // Update session record
    if (result?.state) {
      try {
        await WellnessSession.findOneAndUpdate(
          { sessionId: sid },
          {
            currentAgent: result.state.activeAgent,
            journeyStatus: result.state.journeyStatus,
            mmwbi: result.state.mmwbi,
            riskLevel: result.state.riskLevel,
            status: result.state.journeyStatus === 'completed' ? 'completed' : 'in_progress',
            completedAt: result.state.journeyStatus === 'completed' ? new Date() : null,
            graphState: result.state
          }
        );

        // Record agent execution timeline entry
        if (result.state.activeAgent) {
          await AgentExecution.create({
            sessionId: sid,
            user: userId,
            agentName: result.state.activeAgent,
            nodeName: result.state.activeAgent,
            status: result.state.requiresUserAction ? 'awaiting_user' : 'completed',
            completedAt: new Date(),
            outputSummary: {
              nextAction: result.state.nextAction,
              mmwbi: result.state.mmwbi,
              activeAgent: result.state.activeAgent
            }
          });
        }
      } catch (eErr) {
        console.warn('Execution persistence warning:', eErr.message);
      }
    }

    return apiResponse.success(res, 'LangGraph execution step completed', {
      sessionId: sid,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to resume a paused LangGraph workflow with Human-In-The-Loop (HITL) input
 */
export const resumeGraphSession = async (req, res, next) => {
  try {
    let sessionId = req.params.sessionId || req.body.sessionId;
    const { userActionResult } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      const activeDoc = await WellnessSession.findOne({ user: userId, status: { $ne: 'completed' } }).sort({ updatedAt: -1 });
      if (activeDoc) sessionId = activeDoc.sessionId;
    }

    if (!sessionId) {
      return apiResponse.error(res, 'sessionId is required to resume graph', null, 400);
    }


    const result = await resumeLangGraphWorkflow(sessionId, userActionResult, userId);

    // Record execution timeline entry for resumption
    try {
      await AgentExecution.create({
        sessionId,
        user: userId,
        agentName: result.state?.activeAgent || 'resumption',
        nodeName: result.state?.activeAgent || 'resumption',
        status: 'completed',
        completedAt: new Date(),
        inputSummary: userActionResult,
        outputSummary: {
          nextAction: result.state?.nextAction,
          journeyStatus: result.state?.journeyStatus
        }
      });
    } catch (e) {
      console.warn('Resume execution logging warning:', e.message);
    }

    return apiResponse.success(res, 'LangGraph session resumed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve current graph state for a session
 */
export const fetchGraphState = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    let state = getSessionState(sessionId);

    if (!state) {
      const sessionDoc = await WellnessSession.findOne({ sessionId, user: req.user.id });
      if (sessionDoc?.graphState) {
        state = sessionDoc.graphState;
      }
    }

    if (!state) {
      return apiResponse.error(res, 'Session graph state not found', null, 404);
    }

    return apiResponse.success(res, 'LangGraph state retrieved', state);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve execution timeline history for a session
 */
export const fetchGraphTimeline = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Fetch execution records from MongoDB
    const executions = await AgentExecution.find({ sessionId, user: req.user.id })
      .sort({ createdAt: 1 });

    const events = await AgentEvent.find({ sessionId, user: req.user.id })
      .sort({ timestamp: 1 });

    const state = getSessionState(sessionId);

    return apiResponse.success(res, 'Agent execution timeline retrieved', {
      sessionId,
      executions,
      events,
      completedAgents: state?.completedAgents || [],
      activeAgent: state?.activeAgent || null,
      journeyStatus: state?.journeyStatus || 'in_progress'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to return the graph structure for frontend visualizer
 */
export const fetchGraphTopology = async (req, res, next) => {
  try {
    const topology = {
      nodes: [
        { id: 'wellness_assessment', label: 'Wellness Assessment Agent', type: 'assessment', icon: 'ClipboardCheck' },
        { id: 'reasoning_router', label: 'Reasoning & Router Agent', type: 'router', icon: 'Brain' },
        { id: 'recovery_wellness', label: 'Recovery & Wellness Agent', type: 'agent', icon: 'Moon' },
        { id: 'physical_activity', label: 'Physical Activity Agent', type: 'agent', icon: 'Activity', hitl: true },
        { id: 'psychological_support', label: 'Psychological Support Agent', type: 'agent', icon: 'HeartHandshake', hitl: true },
        { id: 'professional_care', label: 'Professional Care Agent', type: 'agent', icon: 'ShieldAlert' },
        { id: 'reassessment', label: 'Reassessment Loop Engine', type: 'loop', icon: 'RotateCw' },
        { id: 'wellness_plan', label: 'Wellness Plan Generator', type: 'terminal', icon: 'Award' }
      ],
      edges: [
        { source: 'START', target: 'wellness_assessment' },
        { source: 'wellness_assessment', target: 'reasoning_router' },
        { source: 'reasoning_router', target: 'recovery_wellness', conditional: true, label: 'Recovery priority' },
        { source: 'reasoning_router', target: 'physical_activity', conditional: true, label: 'Physical priority' },
        { source: 'reasoning_router', target: 'psychological_support', conditional: true, label: 'Mental priority' },
        { source: 'reasoning_router', target: 'professional_care', conditional: true, label: 'High risk / Crisis' },
        { source: 'reasoning_router', target: 'reassessment', conditional: true, label: 'Re-evaluate' },
        { source: 'reasoning_router', target: 'wellness_plan', conditional: true, label: 'All complete' },
        { source: 'recovery_wellness', target: 'reassessment' },
        { source: 'physical_activity', target: 'reassessment' },
        { source: 'psychological_support', target: 'reassessment' },
        { source: 'professional_care', target: 'wellness_plan' },
        { source: 'reassessment', target: 'reasoning_router', conditional: true, label: 'Loop (pending agents)' },
        { source: 'reassessment', target: 'wellness_plan', conditional: true, label: 'Done' },
        { source: 'wellness_plan', target: 'END' }
      ]
    };

    return apiResponse.success(res, 'LangGraph topology retrieved', topology);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle agent skipping / inactivity timeout in closed-loop journey
 */
export const skipGraphSession = async (req, res, next) => {
  try {
    let sessionId = req.params.sessionId || req.body.sessionId;
    const { agentName, reason } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      const activeDoc = await WellnessSession.findOne({ user: userId, status: { $ne: 'completed' } }).sort({ updatedAt: -1 });
      if (activeDoc) sessionId = activeDoc.sessionId;
    }

    if (!sessionId) {
      return apiResponse.error(res, 'sessionId is required to skip agent step', null, 400);
    }

    const state = getSessionState(sessionId) || {};
    const skippedAgent = agentName || state.activeAgent || 'current_agent';

    const userActionResult = {
      action: 'skipped',
      skippedAgent,
      reason: reason || 'inactivity_timeout'
    };

    // Record skipped execution log in MongoDB
    try {
      await AgentExecution.create({
        sessionId,
        user: userId,
        agentName: skippedAgent,
        nodeName: skippedAgent,
        status: 'skipped',
        completedAt: new Date(),
        inputSummary: `Skipped by system/user: ${reason || 'Inactivity timeout'}`,
        outputSummary: 'LangGraph automatically re-routed to next appropriate agent node.'
      });
    } catch (e) {
      console.warn('Skipped execution logging warning:', e.message);
    }

    const result = await resumeLangGraphWorkflow(sessionId, userActionResult, userId);

    return apiResponse.success(res, 'Agent step skipped. LangGraph automatically selected next step.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch the active session for the authenticated user
 */
export const fetchActiveGraphSession = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let sessionDoc = await WellnessSession.findOne({ user: userId, status: { $ne: 'completed' } })
      .sort({ updatedAt: -1 });

    if (!sessionDoc) {
      sessionDoc = await WellnessSession.findOne({ user: userId }).sort({ updatedAt: -1 });
    }

    if (!sessionDoc) {
      return apiResponse.success(res, 'No active LangGraph session', { session: null, state: null });
    }

    let state = getSessionState(sessionDoc.sessionId);
    if (!state) {
      state = sessionDoc.graphState || {
        sessionId: sessionDoc.sessionId,
        activeAgent: sessionDoc.currentAgent,
        journeyStatus: sessionDoc.journeyStatus || sessionDoc.status,
        mmwbi: sessionDoc.mmwbi,
        riskLevel: sessionDoc.riskLevel
      };
    }

    return apiResponse.success(res, 'Active LangGraph session retrieved', {
      session: sessionDoc,
      state
    });
  } catch (error) {
    next(error);
  }
};

