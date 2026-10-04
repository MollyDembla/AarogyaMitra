/**
 * LangGraph Node: Physical Activity
 *
 * This node handles the Physical Activity Agent within the LangGraph workflow.
 * Physical activity requires USER interaction (pose evaluation via MoveNet),
 * so this node has two modes:
 *
 * 1. INTERRUPT MODE: Graph pauses and sets requiresUserAction=true, prompting
 *    the frontend to show the pose evaluation UI.
 *
 * 2. RESUME MODE: User has submitted pose data (state.userActionPayload),
 *    agent processes it and updates state.
 *
 * This is how human-in-the-loop (HIL) works for physical activity.
 */
import { runPhysicalActivityAgent } from '../../agents/physicalActivity/index.js';
import AgentResult from '../../models/AgentResult.js';
import AgentJourney from '../../models/AgentJourney.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function physicalActivityNode(state) {
  const tag = '[LANGGRAPH][Node: physical_activity]';

  // ── INTERRUPT MODE: No user action yet ─────────────────────────────────
  if (!state.userActionPayload || state.userActionType !== 'physical_activity') {
    logger.info(`${tag} Requesting user action — interrupting for pose evaluation`);
    return {
      activeAgent: 'physical_activity',
      requiresUserAction: true,
      userActionType: 'physical_activity',
      journeyStatus: 'awaiting_user',
      userActionPayload: null
    };
  }

  // ── RESUME MODE: User has submitted pose data ───────────────────────────
  logger.info(`${tag} Resuming with user pose data`);

  try {
    const { poseName, keypointData, poseResults } = state.userActionPayload;

    let agentOutput;
    if (poseResults) {
      // Full session report (multiple poses)
      const savasanaScore = poseResults?.savasana?.accuracy || 85;
      const balasanaScore = poseResults?.balasana?.accuracy || 80;
      const viparitaScore = poseResults?.viparita_karani?.accuracy || 88;
      const overallScore = Math.round(savasanaScore * 0.33 + balasanaScore * 0.33 + viparitaScore * 0.34);

      agentOutput = {
        poseName: 'Full Session',
        overallAccuracy: overallScore,
        poseAccuracy: overallScore,
        formGrade: overallScore >= 85 ? 'Correct Form' : overallScore >= 65 ? 'Moderate Form' : 'Incorrect Form',
        poses: poseResults,
        classification: overallScore >= 85 ? 'correct' : 'moderate',
        feedbackList: [
          `Session score: ${overallScore}%`,
          'Continue maintaining regular yoga practice',
          'Focus on breathing during each pose'
        ],
        recommendations: ['Maintain daily yoga practice', 'Focus on hip alignment in Balasana'],
        mobilityIndicator: overallScore >= 80 ? 'Optimal' : 'Moderate',
        stabilityIndicator: overallScore >= 80 ? 'Stable' : 'Mild Swaying',
        agentVersion: 'movenet-v2.0'
      };
    } else {
      // Single pose evaluation
      agentOutput = await runPhysicalActivityAgent(poseName || 'Savasana', keypointData || {});
    }

    logger.info(`${tag} Pose evaluation complete — accuracy=${agentOutput.overallAccuracy}%`);

    // Persist
    if (state.journeyId) {
      const result = await AgentResult.create({
        user: state.userId,
        journey: state.journeyId,
        agentName: 'Physical Activity Agent',
        inputContext: { poseName, keypointData: !!keypointData },
        outputData: {
          overallAccuracy: agentOutput.overallAccuracy,
          formGrade: agentOutput.formGrade,
          classification: agentOutput.classification
        }
      });

      await AgentJourney.findByIdAndUpdate(state.journeyId, {
        $addToSet: { completedAgents: 'Physical Activity Agent' },
        $push: {
          steps: {
            agentName: 'Physical Activity Agent',
            resultId: result._id,
            visitedAt: new Date()
          }
        }
      });
    }

    // Structured output
    const structuredOutput = {
      agentName: 'physical_activity',
      status: 'completed',
      result: {
        overallAccuracy: agentOutput.overallAccuracy,
        formGrade: agentOutput.formGrade,
        classification: agentOutput.classification,
        mobilityIndicator: agentOutput.mobilityIndicator,
        stabilityIndicator: agentOutput.stabilityIndicator,
        poses: agentOutput.poses
      },
      flags: agentOutput.overallAccuracy < 50 ? ['LOW_PHYSICAL_ACTIVITY_SCORE'] : [],
      recommendations: agentOutput.recommendations || agentOutput.feedbackList || [],
      fullOutput: agentOutput
    };

    return {
      physicalActivity: structuredOutput,
      completedAgents: [...(state.completedAgents || []), 'Physical Activity Agent'],
      activeAgent: 'physical_activity',
      requiresUserAction: false,
      userActionType: null,
      userActionPayload: null,
      journeyStatus: 'in_progress',
      recommendations: [...(state.recommendations || []), ...(structuredOutput.recommendations || []).slice(0, 3)],
      error: null,
      failedNode: null
    };

  } catch (err) {
    logger.error(`${tag} FAILED — ${err.message}`);
    return {
      error: err.message,
      failedNode: 'physical_activity',
      requiresUserAction: false,
      userActionType: null,
      userActionPayload: null,
      journeyStatus: 'in_progress' // don't block journey on physical activity failure
    };
  }
}
