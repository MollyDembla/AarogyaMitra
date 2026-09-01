import WellnessResult from '../models/WellnessResult.js';
import MedicalHealthProfile from '../models/MedicalHealthProfile.js';
import AgentJourney from '../models/AgentJourney.js';
import { runReasoningAgent } from '../agents/reasoningDecision/index.js';
import { apiResponse } from '../utils/apiResponse.js';

export const getNextAction = async (req, res, next) => {
  try {
    const { assessmentId, wellnessResult: passedResult } = req.body;

    let wellnessResult = null;
    if (passedResult && passedResult._id) {
      wellnessResult = passedResult;
    } else if (assessmentId) {
      wellnessResult = await WellnessResult.findOne({ assessment: assessmentId, user: req.user.id });
    }

    if (!wellnessResult) {
      wellnessResult = await WellnessResult.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    }

    if (!wellnessResult) {
      return apiResponse.error(res, 'Wellness result not found', null, 404);
    }

    const medical = assessmentId ? await MedicalHealthProfile.findOne({ assessment: assessmentId }) : null;

    // Fetch existing journey to check completed agents
    let journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' }).sort({ createdAt: -1 });
    const completedAgents = journey ? journey.completedAgents : [];

    // Build context
    const context = {
      wellnessScore: wellnessResult.overallWellBeingScore,
      wellnessCategory: wellnessResult.wellnessCategory,
      riskLevel: wellnessResult.wellnessCategory,
      mmwbi: wellnessResult.overallWellBeingScore,
      domainScores: wellnessResult.domainScores,
      attentionFlags: wellnessResult.attentionFlags || [],
      safetyFlags: wellnessResult.safetyFlags || [],
      primaryConcerns: wellnessResult.primaryConcerns || [],
      physicalLimitations: medical?.physicalLimitations || [],
      rawFeaturePayload: wellnessResult.rawFeaturePayload || {},
      completedAgents
    };

    const decision = await runReasoningAgent(context);

    // If journey doesn't exist, create it
    if (!journey) {
      journey = await AgentJourney.create({
        user: req.user.id,
        assessment: wellnessResult.assessment || null,
        currentAgent: decision.primaryAgent,
        recommendationReason: decision.reason,
        status: 'in_progress',
        completedAgents: []
      });
    } else {
      journey.currentAgent = decision.primaryAgent;
      journey.recommendationReason = decision.reason;
      await journey.save();
    }

    return apiResponse.success(res, 'Routing decision evaluated successfully', {
      decision,
      journeyId: journey._id,
      currentAgent: decision.primaryAgent,
      recommendationReason: decision.reason
    });
  } catch (error) {
    next(error);
  }
};
