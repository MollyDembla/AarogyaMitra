import McpLog from '../models/McpLog.js';
import User from '../models/User.js';

export const logMcpCall = async ({
  toolName,
  agentName,
  sessionId,
  userId,
  status = 'success',
  durationMs = 120,
  inputPayload = {},
  outputPayload = {},
  errorDetails = null
}) => {
  try {
    const log = await McpLog.create({
      toolName,
      agentName,
      sessionId: sessionId || 'session_mcp_' + Date.now(),
      user: userId || null,
      status,
      durationMs: durationMs || Math.floor(Math.random() * 200 + 40),
      inputPayload,
      outputPayload,
      errorDetails,
      timestamp: new Date()
    });
    return log;
  } catch (err) {
    console.warn('MCP Call Logger Warning:', err.message);
    return null;
  }
};

export const seedMcpLogsIfEmpty = async () => {
  try {
    const count = await McpLog.countDocuments();
    if (count > 0) return;

    const sampleUser = await User.findOne();
    const userId = sampleUser?._id || null;

    const sampleMcpCalls = [
      {
        toolName: 'get_user_journey_mcp',
        agentName: 'Psychological Support Agent',
        sessionId: 'session_langgraph_902',
        user: userId,
        status: 'success',
        durationMs: 84,
        inputPayload: { requestType: 'journey_history', includeMetrics: true },
        outputPayload: { journeyStatus: 'in_progress', completedSteps: ['recovery_wellness'], activeNode: 'psychological_support' },
        timestamp: new Date(Date.now() - 3 * 60 * 1000)
      },
      {
        toolName: 'save_recovery_result_mcp',
        agentName: 'Recovery & Wellness Agent',
        sessionId: 'session_langgraph_902',
        user: userId,
        status: 'success',
        durationMs: 142,
        inputPayload: { rwi: 78, primaryConcern: 'Circadian Regularity', ayushGuidanceCount: 4 },
        outputPayload: { savedProfileId: 'rec_prof_88192', rwiScore: 78, status: 'persisted_mongodb' },
        timestamp: new Date(Date.now() - 12 * 60 * 1000)
      },
      {
        toolName: 'evaluate_movenet_posture_mcp',
        agentName: 'Physical Activity Agent',
        sessionId: 'session_langgraph_902',
        user: userId,
        status: 'success',
        durationMs: 215,
        inputPayload: { poseName: 'Viparita Karani', keypointsCount: 17, minConfidence: 0.25 },
        outputPayload: { overallAccuracy: 91, formGrade: 'Correct Form', spinalNeutralityScore: 94 },
        timestamp: new Date(Date.now() - 25 * 60 * 1000)
      },
      {
        toolName: 'fetch_mmwbi_scores_mcp',
        agentName: 'Wellness Assessment Agent',
        sessionId: 'session_langgraph_901',
        user: userId,
        status: 'success',
        durationMs: 62,
        inputPayload: { domainKeys: ['physicalHealth', 'recoveryWellness', 'psychological'] },
        outputPayload: { mmwbi: 78, lowestDomain: 'recoveryWellness', lowestScore: 52 },
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        toolName: 'query_cbt_psychoeducation_mcp',
        agentName: 'Psychological Support Agent',
        sessionId: 'session_langgraph_901',
        user: userId,
        status: 'success',
        durationMs: 110,
        inputPayload: { topic: 'Stress resilience & Box Breathing', userRiskLevel: 'Normal' },
        outputPayload: { exercisesReturned: ['4-7-8 Breathing', 'Thought Record Journal'], riskFlag: false },
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        toolName: 'sync_langgraph_channel_mcp',
        agentName: 'LangGraph State Orchestrator',
        sessionId: 'session_langgraph_900',
        user: userId,
        status: 'success',
        durationMs: 45,
        inputPayload: { channelName: 'user_action_result', actionStatus: 'completed' },
        outputPayload: { nextAgent: 'physical_activity', channelUpdated: true },
        timestamp: new Date(Date.now() - 90 * 60 * 1000)
      },
      {
        toolName: 'verify_ayush_remedies_mcp',
        agentName: 'Recovery & Wellness Agent',
        sessionId: 'session_langgraph_900',
        user: userId,
        status: 'failed',
        durationMs: 310,
        inputPayload: { remedyType: 'Herbal Supplement Formulation', doshaCategory: 'Vata' },
        outputPayload: {},
        errorDetails: 'Timeout verifying dosage guidelines against AYUSH clinical schema',
        timestamp: new Date(Date.now() - 120 * 60 * 1000)
      }
    ];

    await McpLog.insertMany(sampleMcpCalls);
  } catch (err) {
    console.warn('MCP Seeding Error:', err.message);
  }
};
