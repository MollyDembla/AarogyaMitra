/**
 * LangGraph Node: Psychological Support
 *
 * Safety-first design:
 * 1. SAFETY GATE runs first (deterministic)
 * 2. If CRISIS → immediately sets crisisDetected=true, routes to professional care
 * 3. If HIGH_CONCERN → sets highRiskDetected=true, routes to professional care
 * 4. Otherwise: normal support agent runs, awaiting user conversation
 *
 * Human-in-the-loop: Like physical activity, this node pauses for user
 * conversation and resumes with the user's message.
 *
 * KEY: The agent receives full context from previous agents (assessment,
 * recovery) so it does NOT start as an isolated chatbot.
 */
import { runPsychologicalSupportAgent } from '../../agents/psychologicalSupport/index.js';
import { evaluateSafety, RISK_LEVELS } from '../../agents/psychologicalSupport/safetyLayer.js';
import AgentResult from '../../models/AgentResult.js';
import AgentJourney from '../../models/AgentJourney.js';
import PsychSupportSession from '../../models/PsychSupportSession.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function psychologicalSupportNode(state) {
  const tag = '[LANGGRAPH][Node: psychological_support]';

  // ── INTERRUPT MODE: No user message yet ─────────────────────────────────
  if (!state.userActionPayload || state.userActionType !== 'psych_conversation') {
    logger.info(`${tag} Requesting user action — awaiting conversation message`);
    return {
      activeAgent: 'psychological_support',
      requiresUserAction: true,
      userActionType: 'psych_conversation',
      journeyStatus: 'awaiting_user'
    };
  }

  // ── RESUME MODE: User has submitted a message ────────────────────────────
  const { userMessage, conversationHistory } = state.userActionPayload;
  logger.info(`${tag} Processing message — length=${userMessage?.length ?? 0}`);

  try {
    // ── SAFETY GATE (ALWAYS FIRST — deterministic) ──────────────────────────
    // Build minimal context for safety evaluation
    const safetyCtx = {
      mmwbi: state.mmwbi,
      psychometricScores: state.psychometricScores,
      primaryConcerns: state.primaryConcerns,
      safetyFlags: state.safetyFlags
    };
    const safetyResult = evaluateSafety(userMessage, safetyCtx);
    logger.info(`${tag} Safety gate: riskLevel=${safetyResult.riskLevel} label=${safetyResult.riskLabel}`);

    // ── CRISIS DETECTION → Immediate Professional Care ───────────────────
    if (safetyResult.riskLevel === RISK_LEVELS.CRISIS) {
      logger.warn(`${tag} CRISIS_DETECTED — routing to professional care immediately`);
      return {
        crisisDetected: true,
        highRiskDetected: true,
        triggeredEvents: [...(state.triggeredEvents || []), 'CRISIS_DETECTED_IN_PSYCH'],
        detectedFlags: [...(state.detectedFlags || []), 'PSYCH_CRISIS'],
        requiresUserAction: false,
        userActionType: null,
        userActionPayload: null,
        journeyStatus: 'in_progress',
        activeAgent: 'psychological_support',
        // Minimal output indicating crisis
        psychologicalSupport: {
          agentName: 'psychological_support',
          status: 'crisis_escalated',
          result: {
            riskLevel: 'crisis',
            safetyFlag: true,
            requiresImmediateAction: true,
            reply: 'I am deeply concerned about what you have shared. Please reach out to crisis support immediately.'
          },
          flags: ['CRISIS_ESCALATED'],
          recommendations: []
        }
      };
    }

    // ── HIGH_CONCERN DETECTION → Professional Care ───────────────────────
    if (safetyResult.riskLevel === RISK_LEVELS.HIGH_CONCERN) {
      logger.warn(`${tag} HIGH_CONCERN detected — escalating to professional care`);
      // Still run the agent but flag for escalation
      const highRiskOutput = await runPsychologicalSupportAgent(userMessage, {
        ...safetyCtx,
        userName: state.userName,
        rwi: state.recoveryWellness?.result?.recoveryWellnessIndex
      }, conversationHistory || []);

      return {
        highRiskDetected: true,
        triggeredEvents: [...(state.triggeredEvents || []), 'HIGH_CONCERN_DETECTED_IN_PSYCH'],
        detectedFlags: [...(state.detectedFlags || []), 'PSYCH_HIGH_CONCERN'],
        requiresUserAction: false,
        userActionType: null,
        userActionPayload: null,
        journeyStatus: 'in_progress',
        activeAgent: 'psychological_support',
        psychologicalSupport: {
          agentName: 'psychological_support',
          status: 'high_concern_escalated',
          result: highRiskOutput,
          flags: ['HIGH_CONCERN_ESCALATED'],
          recommendations: highRiskOutput.suggestedActivities?.map(a => a.title) || []
        }
      };
    }

    // ── NORMAL PROCESSING ────────────────────────────────────────────────
    // Build rich context from accumulated graph state — this is the key difference
    // vs. an isolated chatbot: the psych agent KNOWS what previous agents found
    const agentContext = {
      mmwbi: state.mmwbi,
      psychometricScores: state.psychometricScores,
      primaryConcerns: state.primaryConcerns,
      safetyFlags: state.safetyFlags,
      userName: state.userName,
      // Recovery agent context forwarded
      rwi: state.recoveryWellness?.result?.recoveryWellnessIndex,
      recoveryLevel: state.recoveryWellness?.result?.overallRecoveryLevel,
      // Domain context
      stressScore: state.domainScores?.stressResilience,
      sleepScore: state.domainScores?.recoveryWellness,
      previousFlags: state.detectedFlags || []
    };

    const agentOutput = await runPsychologicalSupportAgent(
      userMessage,
      agentContext,
      conversationHistory || []
    );

    logger.info(`${tag} Agent output — riskLevel=${agentOutput.riskLevel} safetyFlag=${agentOutput.safetyFlag}`);

    // Check output for safety upgrade
    const outputHighRisk = agentOutput.safetyFlag && agentOutput.riskLevel !== 'low';

    // Persist session
    try {
      const session = await PsychSupportSession.create({
        user: state.userId,
        journey: state.journeyId || null,
        sessionType: 'langgraph_agentic',
        messages: conversationHistory || [],
        sessionSummary: agentOutput.reply?.slice(0, 300) || '',
        riskLevel: agentOutput.riskLevel
      });
    } catch (e) {
      // Session persistence failure is non-fatal
      logger.warn(`${tag} Session persistence warning: ${e.message}`);
    }

    if (state.journeyId) {
      const result = await AgentResult.create({
        user: state.userId,
        journey: state.journeyId,
        agentName: 'Psychological Support Agent',
        inputContext: { userMessageLength: userMessage?.length, safetyLevel: safetyResult.riskLabel },
        outputData: {
          riskLevel: agentOutput.riskLevel,
          safetyFlag: agentOutput.safetyFlag,
          emotionalState: agentOutput.emotionalState
        }
      });

      await AgentJourney.findByIdAndUpdate(state.journeyId, {
        $addToSet: { completedAgents: 'Psychological Support Agent' },
        $push: {
          steps: {
            agentName: 'Psychological Support Agent',
            resultId: result._id,
            visitedAt: new Date()
          }
        }
      });
    }

    const structuredOutput = {
      agentName: 'psychological_support',
      status: 'completed',
      result: agentOutput,
      flags: outputHighRisk ? ['HIGH_CONCERN_IN_RESPONSE'] : [],
      recommendations: agentOutput.suggestedActivities?.map(a => a.title) || []
    };

    return {
      psychologicalSupport: structuredOutput,
      completedAgents: [...(state.completedAgents || []), 'Psychological Support Agent'],
      activeAgent: 'psychological_support',
      requiresUserAction: false,
      userActionType: null,
      userActionPayload: null,
      journeyStatus: 'in_progress',
      highRiskDetected: state.highRiskDetected || outputHighRisk,
      recommendations: [...(state.recommendations || []), ...structuredOutput.recommendations.slice(0, 3)],
      triggeredEvents: outputHighRisk
        ? [...(state.triggeredEvents || []), 'HIGH_CONCERN_IN_PSYCH_RESPONSE']
        : (state.triggeredEvents || []),
      error: null,
      failedNode: null
    };

  } catch (err) {
    logger.error(`${tag} FAILED — ${err.message}`);
    return {
      error: err.message,
      failedNode: 'psychological_support',
      requiresUserAction: false,
      userActionType: null,
      journeyStatus: 'in_progress'
    };
  }
}
