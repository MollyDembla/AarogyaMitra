import { runPhysicalActivityAgent } from '../agents/physicalActivity/index.js';
import { runPsychologicalSupportAgent } from '../agents/psychologicalSupport/index.js';
import { runProfessionalSupportPathway } from '../agents/professionalSupport/index.js';
import { runRecoveryWellnessAgent } from '../agents/recoveryWellness/index.js';
import AgentResult from '../models/AgentResult.js';
import AgentJourney from '../models/AgentJourney.js';
import WellnessResult from '../models/WellnessResult.js';
import WellnessReport from '../models/WellnessReport.js';
import RecoveryProfile from '../models/RecoveryProfile.js';
import { apiResponse } from '../utils/apiResponse.js';

export const evaluatePhysicalActivity = async (req, res, next) => {
  try {
    const { journeyId, poseName, keypointData } = req.body;

    const journey = await AgentJourney.findOne({ _id: journeyId, user: req.user.id });
    if (!journey) {
      return apiResponse.error(res, 'Journey not found', null, 404);
    }

    const evaluation = await runPhysicalActivityAgent(poseName, keypointData);

    const result = await AgentResult.create({
      user: req.user.id,
      journey: journeyId,
      agentName: 'Physical Activity Agent',
      inputContext: { poseName },
      outputData: evaluation
    });

    journey.steps.push({ agentName: 'Physical Activity Agent', resultId: result._id });
    if (!journey.completedAgents.includes('Physical Activity Agent')) {
      journey.completedAgents.push('Physical Activity Agent');
    }
    await journey.save();

    return apiResponse.success(res, 'Pose evaluation completed', result);
  } catch (error) {
    next(error);
  }
};

export const generatePhysicalActivityReport = async (req, res, next) => {
  try {
    const { journeyId, sessionId, poseResults, overallScore } = req.body;

    const savasanaScore = poseResults?.savasana?.accuracy || 85;
    const balasanaScore = poseResults?.balasana?.accuracy || 80;
    const viparitaScore = poseResults?.viparita_karani?.accuracy || 88;
    const calculatedOverall = Math.round(savasanaScore * 0.33 + balasanaScore * 0.33 + viparitaScore * 0.34);

    const structuredReport = {
      sessionId: sessionId || `PA-SESSION-${Date.now()}`,
      overallScore: overallScore || calculatedOverall,
      poses: {
        savasana: poseResults?.savasana || { classification: 'correct', accuracy: savasanaScore, stability: 94 },
        balasana: poseResults?.balasana || { classification: 'moderate', accuracy: balasanaScore, stability: 88 },
        viparita_karani: poseResults?.viparita_karani || { classification: 'correct', accuracy: viparitaScore, stability: 92 }
      },
      keyObservations: [
        `Strong posture alignment in Savasana (${savasanaScore}% Accuracy)`,
        `Good spinal decompression stability in Viparita Karani (${viparitaScore}% Accuracy)`,
        `Balasana showed slight hip flexor tilt (${balasanaScore}% Accuracy)`
      ],
      areasForImprovement: [
        'Practice deepening pelvic fold in Balasana while keeping hips lowered toward heels',
        'Maintain relaxed shoulder blades in supine postures'
      ],
      suggestions: [
        'Perform 5-10 minutes of gentle hip flexor stretches before Balasana',
        'Use a thin blanket prop under hips during restorative practice'
      ],
      disclaimer: 'Physical Activity Pose Performance Score is a prototype wellness indicator and does not constitute a medical diagnosis.'
    };

    // Save to AgentResult
    const result = await AgentResult.create({
      user: req.user.id,
      journey: journeyId || null,
      agentName: 'Physical Activity Agent',
      inputContext: { type: 'FULL_SESSION_REPORT', sessionId },
      outputData: structuredReport
    });

    return apiResponse.success(res, 'Physical Activity Session Report generated', {
      success: true,
      report: structuredReport,
      resultId: result._id
    });
  } catch (error) {
    next(error);
  }
};

export const getPhysicalActivityHistory = async (req, res, next) => {
  try {
    const history = await AgentResult.find({
      user: req.user.id,
      agentName: 'Physical Activity Agent'
    }).sort({ createdAt: -1 }).limit(20);

    return apiResponse.success(res, 'Physical Activity history retrieved', history);
  } catch (error) {
    next(error);
  }
};

export const sessionPsychologicalSupport = async (req, res, next) => {
  try {
    const { journeyId, userMessage, previousHistory } = req.body;

    const journey = await AgentJourney.findOne({ _id: journeyId, user: req.user.id });
    if (!journey) {
      return apiResponse.error(res, 'Journey not found', null, 404);
    }

    const sessionOutput = await runPsychologicalSupportAgent(userMessage, previousHistory);

    const result = await AgentResult.create({
      user: req.user.id,
      journey: journeyId,
      agentName: 'Psychological Support Agent',
      inputContext: { userMessage, previousHistory },
      outputData: sessionOutput
    });

    journey.steps.push({ agentName: 'Psychological Support Agent', resultId: result._id });
    if (!journey.completedAgents.includes('Psychological Support Agent')) {
      journey.completedAgents.push('Psychological Support Agent');
    }
    await journey.save();

    return apiResponse.success(res, 'Psychological support session recorded', result);
  } catch (error) {
    next(error);
  }
};

export const evaluateProfessionalSupport = async (req, res, next) => {
  try {
    const { journeyId } = req.body;

    // Load latest wellness context — pass to professional agent for deterministic evaluation
    const wellnessResult = await WellnessResult.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const RecoveryProfile = (await import('../models/RecoveryProfile.js')).default;
    const recoveryProfile = await RecoveryProfile.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    let journey = journeyId
      ? await AgentJourney.findOne({ _id: journeyId, user: req.user.id })
      : await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' }).sort({ createdAt: -1 });

    const context = wellnessResult ? {
      mmwbi: wellnessResult.overallWellBeingScore,
      domainScores: wellnessResult.domainScores,
      psychometricScores: wellnessResult.psychometricScores,
      primaryConcerns: wellnessResult.primaryConcerns,
      safetyFlags: wellnessResult.safetyFlags || [],
      attentionFlags: wellnessResult.attentionFlags || [],
      recoveryScore: recoveryProfile?.recoveryWellnessIndex,
      firstName: req.user.firstName
    } : {};

    const evaluation = await runProfessionalSupportPathway(context);

    const result = await AgentResult.create({
      user: req.user.id,
      journey: journey?._id,
      agentName: 'Professional Support Pathway',
      inputContext: { wellnessResultId: wellnessResult?._id },
      outputData: evaluation
    });

    journey.steps.push({ agentName: 'Professional Support Pathway', resultId: result._id });
    if (!journey.completedAgents.includes('Professional Support Pathway')) {
      journey.completedAgents.push('Professional Support Pathway');
    }
    await journey.save();

    return apiResponse.success(res, 'Professional Support evaluation completed', result);
  } catch (error) {
    next(error);
  }
};

export const planRecoveryWellness = async (req, res, next) => {
  try {
    const { journeyId, exceptionalConditions } = req.body;

    // Load journey (optional — accept no journeyId for direct calls)
    let journey = null;
    if (journeyId) {
      journey = await AgentJourney.findOne({ _id: journeyId, user: req.user.id });
    }
    if (!journey) {
      journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' })
        .sort({ createdAt: -1 });
    }

    // Load the latest WellnessResult for full context
    const wellnessResult = await WellnessResult.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });
    const wellnessReport = await WellnessReport.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });

    if (!wellnessResult) {
      return apiResponse.error(res, 'No wellness assessment found. Please complete an assessment first.', null, 404);
    }

    // Build full context object for the Recovery and Wellness Agent
    const agentContext = {
      result: wellnessResult,
      report: wellnessReport,
      domainScores: wellnessResult.domainScores,
      psychometricScores: wellnessResult.psychometricScores,
      rawFeaturePayload: wellnessResult.rawFeaturePayload || {},
      riskLevel: wellnessResult.wellnessCategory,
      mmwbi: wellnessResult.overallWellBeingScore,
      attentionFlags: wellnessResult.attentionFlags || [],
      safetyFlags: wellnessResult.safetyFlags || [],
      primaryConcerns: wellnessResult.primaryConcerns || [],
      exceptionalConditions: exceptionalConditions || '',
      userName: req.user.firstName
    };

    // Run Recovery and Wellness Agent
    const agentOutput = await runRecoveryWellnessAgent(agentContext);

    // Persist Recovery Profile
    const recoveryProfile = await RecoveryProfile.create({
      user: req.user.id,
      journey: journey?._id || null,
      assessment: wellnessResult.assessment || null,
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
      exceptionalConditions: agentOutput.exceptionalConditions || '',
      routinePlan: agentOutput.routinePlan || null,
      alertnessSafetyFlag: agentOutput.alertnessSafetyFlag,
      personalizedRecommendations: agentOutput.personalizedRecommendations,
      followUpQuestions: agentOutput.followUpQuestions,
      nextAction: agentOutput.nextAction
    });

    // Persist AgentResult
    const result = await AgentResult.create({
      user: req.user.id,
      journey: journey?._id || null,
      agentName: 'Recovery and Wellness Agent',
      inputContext: { wellnessResultId: wellnessResult._id },
      outputData: agentOutput
    });

    // Update Journey
    if (journey) {
      journey.steps.push({ agentName: 'Recovery and Wellness Agent', resultId: result._id });
      if (!journey.completedAgents.includes('Recovery and Wellness Agent')) {
        journey.completedAgents.push('Recovery and Wellness Agent');
      }
      await journey.save();
    }

    return apiResponse.success(res, 'Recovery wellness plan generated', {
      agentOutput,
      recoveryProfile,
      agentResult: result
    });
  } catch (error) {
    console.error('planRecoveryWellness error:', error);
    next(error);
  }
};
