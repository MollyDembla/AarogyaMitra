/**
 * LangGraph Node: Recovery & Wellness
 *
 * Wraps the existing runRecoveryWellnessAgent.
 * Receives full graph state (assessment context + previous agent outputs).
 * Returns structured output and state patch.
 */
import { runRecoveryWellnessAgent } from '../../agents/recoveryWellness/index.js';
import RecoveryProfile from '../../models/RecoveryProfile.js';
import AgentResult from '../../models/AgentResult.js';
import AgentJourney from '../../models/AgentJourney.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function recoveryWellnessNode(state) {
  const tag = '[LANGGRAPH][Node: recovery_wellness]';
  logger.info(`${tag} Starting — mmwbi=${state.mmwbi} rwi_from_prev=${state.recoveryWellness?.recoveryWellnessIndex ?? 'none'}`);

  try {
    // Build context from accumulated graph state
    // This is how agents interact: each node sees all previous outputs
    const agentContext = {
      domainScores: state.domainScores,
      psychometricScores: state.psychometricScores,
      rawFeaturePayload: state.rawFeaturePayload || {},
      riskLevel: state.riskLevel,
      mmwbi: state.mmwbi,
      attentionFlags: state.attentionFlags || [],
      safetyFlags: state.safetyFlags || [],
      primaryConcerns: state.primaryConcerns || [],
      userName: state.userName || '',
      // Include previous psychological context if available
      previousPsychOutput: state.psychologicalSupport
        ? {
            safetyFlag: state.psychologicalSupport.safetyFlag,
            riskLevel: state.psychologicalSupport.riskLevel,
            emotionalState: state.psychologicalSupport.emotionalState
          }
        : null
    };

    // Run the existing Recovery & Wellness Agent (unchanged)
    const agentOutput = await runRecoveryWellnessAgent(agentContext);

    logger.info(`${tag} RWI=${agentOutput.recoveryWellnessIndex} level=${agentOutput.overallRecoveryLevel}`);
    logger.info(`${tag} Alertness safety flag: ${agentOutput.alertnessSafetyFlag}`);

    // Check if recovery results trigger additional safety concern
    const safetyEscalation = agentOutput.alertnessSafetyFlag;
    if (safetyEscalation) {
      logger.warn(`${tag} ALERTNESS_SAFETY_FLAG detected — may need professional care`);
    }

    // Persist to MongoDB
    const recoveryProfileDoc = await RecoveryProfile.create({
      user: state.userId,
      journey: state.journeyId || null,
      assessment: state.assessmentId || null,
      recoveryWellnessIndex: agentOutput.recoveryWellnessIndex,
      overallRecoveryLevel: agentOutput.overallRecoveryLevel,
      rwiColor: agentOutput.rwiColor,
      dimensionScores: agentOutput.dimensionScores,
      primaryConcern: agentOutput.primaryConcern,
      secondaryConcerns: agentOutput.secondaryConcerns,
      contributingFactors: agentOutput.contributingFactors,
      protectiveFactors: agentOutput.protectiveFactors,
      detectedPatterns: agentOutput.detectedPatterns,
      recoverySummary: agentOutput.recoverySummary,
      alertnessSafetyFlag: agentOutput.alertnessSafetyFlag,
      personalizedRecommendations: agentOutput.personalizedRecommendations,
      followUpQuestions: agentOutput.followUpQuestions,
      nextAction: agentOutput.nextAction
    });

    // Persist AgentResult
    if (state.journeyId) {
      const result = await AgentResult.create({
        user: state.userId,
        journey: state.journeyId,
        agentName: 'Recovery and Wellness Agent',
        inputContext: {
          mmwbi: state.mmwbi,
          domainScores: state.domainScores
        },
        outputData: {
          recoveryWellnessIndex: agentOutput.recoveryWellnessIndex,
          overallRecoveryLevel: agentOutput.overallRecoveryLevel,
          primaryConcern: agentOutput.primaryConcern,
          alertnessSafetyFlag: agentOutput.alertnessSafetyFlag
        }
      });

      await AgentJourney.findByIdAndUpdate(state.journeyId, {
        $addToSet: { completedAgents: 'Recovery and Wellness Agent' },
        $push: {
          steps: {
            agentName: 'Recovery and Wellness Agent',
            resultId: result._id,
            visitedAt: new Date()
          }
        }
      });
    }

    // Structured output for graph state
    const structuredOutput = {
      agentName: 'recovery_wellness',
      status: 'completed',
      result: {
        recoveryWellnessIndex: agentOutput.recoveryWellnessIndex,
        overallRecoveryLevel: agentOutput.overallRecoveryLevel,
        dimensionScores: agentOutput.dimensionScores,
        primaryConcern: agentOutput.primaryConcern,
        secondaryConcerns: agentOutput.secondaryConcerns,
        alertnessSafetyFlag: agentOutput.alertnessSafetyFlag,
        recoverySummary: agentOutput.recoverySummary
      },
      flags: safetyEscalation ? ['ALERTNESS_SAFETY_FLAG'] : [],
      recommendations: [
        ...(agentOutput.personalizedRecommendations?.sleepHygiene?.map(r => r.title || r) || []),
        ...(agentOutput.personalizedRecommendations?.stressManagement?.map(r => r.title || r) || [])
      ].slice(0, 5),
      fullOutput: agentOutput
    };

    logger.info(`${tag} Completed successfully`);

    return {
      recoveryWellness: structuredOutput,
      completedAgents: [...(state.completedAgents || []), 'Recovery and Wellness Agent'],
      activeAgent: 'recovery_wellness',
      recommendations: [
        ...(state.recommendations || []),
        ...structuredOutput.recommendations
      ],
      detectedFlags: safetyEscalation
        ? [...(state.detectedFlags || []), 'ALERTNESS_SAFETY_FLAG']
        : (state.detectedFlags || []),
      // Escalate high risk if alertness safety flag is critical
      highRiskDetected: state.highRiskDetected || (safetyEscalation && agentOutput.recoveryWellnessIndex < 30),
      error: null,
      failedNode: null
    };

  } catch (err) {
    logger.error(`${tag} FAILED — ${err.message}`);
    return {
      error: err.message,
      failedNode: 'recovery_wellness',
      journeyStatus: 'error'
    };
  }
}
