/**
 * LangGraph Node: Professional Care Navigation
 *
 * Deterministic, safety-critical node.
 * - Triggered when highRiskDetected or crisisDetected is true
 * - Triggered by care_level routing from the router
 * - Uses existing runProfessionalSupportPathway (fully rule-based)
 * - LLM does NOT make safety routing decisions here
 *
 * Consumes full graph state including all previous agent outputs.
 */
import { runProfessionalSupportPathway } from '../../agents/professionalSupport/index.js';
import AgentResult from '../../models/AgentResult.js';
import AgentJourney from '../../models/AgentJourney.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function professionalCareNode(state) {
  const tag = '[LANGGRAPH][Node: professional_care]';
  logger.info(`${tag} Starting — highRisk=${state.highRiskDetected} crisis=${state.crisisDetected}`);

  if (state.crisisDetected) {
    logger.warn(`${tag} CRISIS MODE — immediate resources`);
  }

  try {
    // Build comprehensive context from ALL previous agent outputs
    // This is genuine agent-to-agent communication via shared graph state
    const agentContext = {
      mmwbi: state.mmwbi,
      domainScores: state.domainScores,
      psychometricScores: state.psychometricScores,
      primaryConcerns: state.primaryConcerns,
      safetyFlags: state.safetyFlags,
      attentionFlags: state.attentionFlags,
      firstName: state.userName || 'there',

      // Recovery agent results forwarded
      recoveryScore: state.recoveryWellness?.result?.recoveryWellnessIndex,
      alertnessSafetyFlag: state.recoveryWellness?.result?.alertnessSafetyFlag,

      // Psychological agent results forwarded
      psychRiskLevel: state.psychologicalSupport?.result?.riskLevel,
      psychSafetyFlag: state.psychologicalSupport?.result?.safetyFlag,

      // Cross-agent detected flags
      detectedFlags: state.detectedFlags || [],
      triggeredEvents: state.triggeredEvents || [],

      // Physical limitations from assessment payload
      physicalLimitations: state.rawFeaturePayload?.Physical_Limitation !== 'None'
        ? [state.rawFeaturePayload?.Physical_Limitation].filter(Boolean)
        : [],

      // Crisis state from graph
      crisisDetected: state.crisisDetected,
      highRiskDetected: state.highRiskDetected
    };

    // Run the existing deterministic Professional Care Navigation Agent
    const agentOutput = await runProfessionalSupportPathway(agentContext);

    logger.info(`${tag} Care level=${agentOutput.careLevel} urgency=${agentOutput.urgency} type=${agentOutput.professionalType}`);

    // Persist
    if (state.journeyId) {
      const result = await AgentResult.create({
        user: state.userId,
        journey: state.journeyId,
        agentName: 'Professional Support Pathway',
        inputContext: {
          mmwbi: state.mmwbi,
          crisisDetected: state.crisisDetected,
          highRiskDetected: state.highRiskDetected,
          triggeredEvents: state.triggeredEvents
        },
        outputData: {
          careLevel: agentOutput.careLevel,
          urgency: agentOutput.urgency,
          professionalType: agentOutput.professionalType,
          reason: agentOutput.reason
        }
      });

      await AgentJourney.findByIdAndUpdate(state.journeyId, {
        $addToSet: { completedAgents: 'Professional Support Pathway' },
        $push: {
          steps: {
            agentName: 'Professional Support Pathway',
            resultId: result._id,
            visitedAt: new Date()
          }
        }
      });
    }

    const structuredOutput = {
      agentName: 'professional_care',
      status: 'completed',
      result: {
        careLevel: agentOutput.careLevel,
        careLevelLabel: agentOutput.careLevelLabel,
        urgency: agentOutput.urgency,
        urgencyColor: agentOutput.urgencyColor,
        urgencyDescription: agentOutput.urgencyDescription,
        reason: agentOutput.reason,
        professionalType: agentOutput.professionalType,
        nextSteps: agentOutput.nextSteps,
        resources: agentOutput.resources,
        crisisResources: agentOutput.crisisResources,
        safetyDisclaimer: agentOutput.safetyDisclaimer
      },
      flags: state.crisisDetected ? ['CRISIS_CARE_NAVIGATED'] : ['HIGH_RISK_CARE_NAVIGATED'],
      recommendations: agentOutput.nextSteps?.slice(0, 3) || [],
      fullOutput: agentOutput
    };

    return {
      careNavigation: structuredOutput,
      completedAgents: [...(state.completedAgents || []), 'Professional Support Pathway'],
      activeAgent: 'professional_care',
      recommendations: [...(state.recommendations || []), ...(structuredOutput.recommendations || [])],
      journeyStatus: 'in_progress',
      error: null,
      failedNode: null
    };

  } catch (err) {
    logger.error(`${tag} FAILED — ${err.message}`);
    return {
      error: err.message,
      failedNode: 'professional_care',
      journeyStatus: 'error'
    };
  }
}
