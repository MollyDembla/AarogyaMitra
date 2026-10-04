/**
 * LangGraph Node: Wellness Assessment
 *
 * Calls the existing runWellnessAssessmentAgent, saves/updates the result to
 * MongoDB, and returns a state patch so LangGraph can update shared state.
 *
 * This is the ENTRY POINT of the wellness graph. It always runs first.
 */

import { runWellnessAssessmentAgent } from '../../agents/wellnessAssessment/index.js';
import WellnessResult from '../../models/WellnessResult.js';
import WellnessAssessment from '../../models/WellnessAssessment.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - current WellnessGraphState
 * @returns {Object} state patch
 */
export async function wellnessAssessmentNode(state) {
  const tag = '[LANGGRAPH][Node: wellness_assessment]';
  logger.info(`${tag} Starting — userId=${state.userId} sessionId=${state.sessionId}`);

  try {
    const assessmentData = state.assessmentData || {};

    // Run the existing Wellness Assessment Agent
    const agentOutput = await runWellnessAssessmentAgent(assessmentData);

    logger.info(`${tag} Agent complete — MMWBI=${agentOutput.mmwbi} riskLevel=${agentOutput.riskLevel}`);

    let assessmentDoc = null;
    let wellnessResult = null;

    // Safely link or update MongoDB documents
    if (state.userId) {
      try {
        if (state.assessmentId) {
          assessmentDoc = await WellnessAssessment.findByIdAndUpdate(
            state.assessmentId,
            { status: 'completed', completedAt: new Date() },
            { new: true }
          );
        }

        if (!assessmentDoc) {
          const count = await WellnessAssessment.countDocuments({ user: state.userId });
          assessmentDoc = await WellnessAssessment.create({
            user: state.userId,
            assessmentNumber: count + 1,
            status: 'completed',
            currentStep: 11,
            completedAt: new Date()
          });
        }

        if (state.wellnessResultId) {
          wellnessResult = await WellnessResult.findById(state.wellnessResultId);
        }

        if (!wellnessResult && assessmentDoc) {
          wellnessResult = await WellnessResult.create({
            user: state.userId,
            assessment: assessmentDoc._id,
            overallWellBeingScore: agentOutput.mmwbi,
            wellnessCategory: agentOutput.riskLevel,
            userFacingRiskLabel: agentOutput.userFacingRiskLabel,
            domainScores: agentOutput.domainScores,
            mmwbiBreakdown: agentOutput.mmwbiBreakdown,
            psychometricScores: agentOutput.psychometricScores,
            primaryConcerns: agentOutput.primaryConcerns,
            strengths: agentOutput.strengths,
            attentionFlags: agentOutput.attentionFlags,
            safetyFlags: agentOutput.safetyFlags,
            explanations: agentOutput.explanations,
            dataCompleteness: agentOutput.dataCompleteness,
            rawFeaturePayload: agentOutput.rawFeaturePayload
          });
        }
      } catch (dbErr) {
        logger.warn(`${tag} DB persistence warning (non-fatal for graph execution):`, dbErr.message);
      }
    }

    // Safety checks
    const highRiskDetected = (agentOutput.safetyFlags && agentOutput.safetyFlags.length > 0) ||
      agentOutput.riskLevel === 'Critical Risk' ||
      agentOutput.psychometricScores?.phq9?.severity === 'Severe' ||
      agentOutput.psychometricScores?.gad7?.severity === 'Severe' ||
      (agentOutput.mmwbi !== undefined && agentOutput.mmwbi < 20);

    const crisisDetected = agentOutput.safetyFlags && agentOutput.safetyFlags.some(
      f => f?.type === 'CRISIS' || f?.message?.toLowerCase().includes('crisis') ||
           f?.message?.toLowerCase().includes('suicid') || f?.message?.toLowerCase().includes('harm')
    );

    return {
      mmwbi: agentOutput.mmwbi,
      riskLevel: agentOutput.riskLevel,
      userFacingRiskLabel: agentOutput.userFacingRiskLabel,
      domainScores: agentOutput.domainScores,
      psychometricScores: agentOutput.psychometricScores,
      attentionFlags: agentOutput.attentionFlags || [],
      safetyFlags: agentOutput.safetyFlags || [],
      primaryConcerns: agentOutput.primaryConcerns || [],
      strengths: agentOutput.strengths || [],
      rawFeaturePayload: agentOutput.rawFeaturePayload || {},
      assessmentId: assessmentDoc?._id?.toString() || state.assessmentId,
      wellnessResultId: wellnessResult?._id?.toString() || state.wellnessResultId,
      highRiskDetected,
      crisisDetected,
      activeAgent: 'wellness_assessment',
      completedAgents: ['wellness_assessment']
    };
  } catch (err) {
    logger.error(`${tag} Critical failure in wellness_assessment node:`, err);
    return {
      error: err.message,
      failedNode: 'wellness_assessment',
      journeyStatus: 'failed'
    };
  }
}
