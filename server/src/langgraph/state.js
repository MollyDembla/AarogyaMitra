/**
 * AarogyaMitra LangGraph — Shared Wellness Graph State
 *
 * This is the single shared state object that flows through
 * the entire LangGraph workflow. Every node reads from and
 * writes to this state. MongoDB is the persistence layer;
 * this object is the orchestration state.
 */

/**
 * Create a fresh initial graph state for a new session.
 * @param {string} userId
 * @param {string} sessionId
 * @param {Object} assessmentData  - raw wellness assessment payload
 * @returns {Object} WellnessGraphState
 */
export function createInitialState(userId, sessionId, assessmentData = {}) {
  return {
    // ── Identity ───────────────────────────────────────────────────────────
    sessionId,
    userId,
    userName: assessmentData.userName || assessmentData.firstName || '',

    // ── Assessment Input ───────────────────────────────────────────────────
    assessmentData,           // raw input payload from the user
    assessmentId: null,       // MongoDB WellnessAssessment doc ID

    // ── Assessment Output (from Wellness Assessment Node) ──────────────────
    mmwbi: null,
    riskLevel: null,
    userFacingRiskLabel: null,
    domainScores: {
      physicalHealth: null,
      recoveryWellness: null,
      psychologicalWellbeing: null,
      socialWellbeing: null,
      lifestyleBalance: null,
      stressResilience: null
    },
    psychometricScores: {},
    attentionFlags: [],
    safetyFlags: [],          // PHQ-9 Q9 / crisis flags — HIGHEST PRIORITY
    primaryConcerns: [],
    strengths: [],
    wellnessResultId: null,   // MongoDB WellnessResult doc ID

    // ── Domain-specific Agent Outputs ──────────────────────────────────────
    recoveryWellness: null,   // output from Recovery & Wellness Agent
    physicalActivity: null,   // output from Physical Activity Agent
    psychologicalSupport: null, // output from Psychological Support Agent
    careNavigation: null,     // output from Professional Care Navigation Agent
    wellnessPlan: null,       // final synthesized wellness plan

    // ── Orchestration Control ──────────────────────────────────────────────
    activeAgent: null,        // currently executing node
    completedAgents: [],      // agents that have completed this session
    pendingAgents: [],        // agents queued for execution
    triggeredEvents: [],      // notable events that occurred (HIGH_RISK, etc.)
    detectedFlags: [],        // cross-agent flags

    // ── Safety State ──────────────────────────────────────────────────────
    highRiskDetected: false,  // if true, route immediately to professional care
    crisisDetected: false,    // if true, IMMEDIATE professional care required

    // ── Routing / Flow ────────────────────────────────────────────────────
    nextAction: null,         // router decision: which node to run next
    routerDecision: null,     // full router result object
    journeyStatus: 'pending', // pending | in_progress | awaiting_user | completed | error

    // ── Human-in-the-Loop ─────────────────────────────────────────────────
    requiresUserAction: false,
    userActionType: null,     // 'physical_activity' | 'psych_conversation' | null
    userActionPayload: null,  // data submitted by user to resume the graph
    userActionResult: null,   // result after user action is processed

    // ── Loop Control ──────────────────────────────────────────────────────
    iterationCount: 0,
    maxIterations: 8,         // safety ceiling for reassessment loops
    reassessmentCount: 0,

    // ── Recommendations ───────────────────────────────────────────────────
    recommendations: [],      // accumulated across all agents

    // ── Persistence ───────────────────────────────────────────────────────
    journeyId: null,          // MongoDB AgentJourney doc ID
    checkpointData: null,     // serialized state snapshot for resumption

    // ── Error State ───────────────────────────────────────────────────────
    error: null,
    lastError: null,
    failedNode: null
  };
}

/**
 * Produce a partial state update patch.
 * Nodes return these patches; the graph merges them.
 */
export function stateUpdate(patch) {
  return patch;
}

/**
 * Serialize key state fields for MongoDB checkpointing.
 */
export function serializeStateForCheckpoint(state) {
  return {
    sessionId: state.sessionId,
    userId: state.userId,
    mmwbi: state.mmwbi,
    riskLevel: state.riskLevel,
    domainScores: state.domainScores,
    attentionFlags: state.attentionFlags,
    safetyFlags: state.safetyFlags,
    completedAgents: state.completedAgents,
    activeAgent: state.activeAgent,
    journeyStatus: state.journeyStatus,
    highRiskDetected: state.highRiskDetected,
    crisisDetected: state.crisisDetected,
    iterationCount: state.iterationCount,
    nextAction: state.nextAction,
    requiresUserAction: state.requiresUserAction,
    userActionType: state.userActionType,
    recoveryWellness: state.recoveryWellness
      ? { recoveryWellnessIndex: state.recoveryWellness.recoveryWellnessIndex }
      : null,
    physicalActivity: state.physicalActivity
      ? { overallAccuracy: state.physicalActivity.overallAccuracy }
      : null,
    error: state.error
  };
}
