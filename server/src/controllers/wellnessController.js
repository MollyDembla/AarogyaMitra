import WellnessAssessment from '../models/WellnessAssessment.js';
import PsychometricAssessment from '../models/PsychometricAssessment.js';
import LifestyleBehavioralInput from '../models/LifestyleBehavioralInput.js';
import MedicalHealthProfile from '../models/MedicalHealthProfile.js';
import UserProfile from '../models/UserProfile.js';
import WellnessResult from '../models/WellnessResult.js';
import WellnessReport from '../models/WellnessReport.js';
import ProgressRecord from '../models/ProgressRecord.js';
import AgentJourney from '../models/AgentJourney.js';
import { runWellnessAssessmentAgent } from '../agents/wellnessAssessment/index.js';
import { runReasoningAgent } from '../agents/reasoningDecision/index.js';
import { generateWellnessReport } from '../services/reportGenerator.js';
import { apiResponse } from '../utils/apiResponse.js';

export const evaluateWellness = async (req, res, next) => {
  try {
    const { assessmentId, rawInputs } = req.body;

    let payload = rawInputs || (req.body.WHO5_Q1 !== undefined ? req.body : null);
    let assessmentDoc = null;

    if (assessmentId) {
      assessmentDoc = await WellnessAssessment.findOne({ _id: assessmentId, user: req.user.id });
    }

    if (!payload && assessmentDoc) {
      const [psychometric, lifestyle, medical, profile] = await Promise.all([
        PsychometricAssessment.findOne({ assessment: assessmentId }),
        LifestyleBehavioralInput.findOne({ assessment: assessmentId }),
        MedicalHealthProfile.findOne({ assessment: assessmentId }),
        UserProfile.findOne({ user: req.user.id })
      ]);

      // Merge into dataset structure
      payload = {
        Age: profile?.age,
        Gender: profile?.gender,
        Height_cm: profile?.height,
        Weight_kg: profile?.weight,
        Education_Level: profile?.education,
        Occupation: profile?.occupation,
        Work_Pattern: profile?.workPattern,

        Physical_Activity_Minutes_Daily: lifestyle?.physicalActivity?.avgDurationMinutes,
        Exercise_Days_Per_Week: lifestyle?.physicalActivity?.daysPerWeek,
        Sedentary_Hours_Daily: lifestyle?.sedentaryTime?.hoursSittingPerDay,

        WHO5_Q1: psychometric?.who5?.responses?.[0],
        WHO5_Q2: psychometric?.who5?.responses?.[1],
        WHO5_Q3: psychometric?.who5?.responses?.[2],
        WHO5_Q4: psychometric?.who5?.responses?.[3],
        WHO5_Q5: psychometric?.who5?.responses?.[4],

        PSS10_Q1: psychometric?.pss10?.responses?.[0],
        PSS10_Q2: psychometric?.pss10?.responses?.[0],
        PSS10_Q3: psychometric?.pss10?.responses?.[2],
        PSS10_Q4: psychometric?.pss10?.responses?.[3],
        PSS10_Q5: psychometric?.pss10?.responses?.[4],
        PSS10_Q6: psychometric?.pss10?.responses?.[5],
        PSS10_Q7: psychometric?.pss10?.responses?.[6],
        PSS10_Q8: psychometric?.pss10?.responses?.[7],
        PSS10_Q9: psychometric?.pss10?.responses?.[8],
        PSS10_Q10: psychometric?.pss10?.responses?.[9],

        GAD7_Q1: psychometric?.gad7?.responses?.[0],
        GAD7_Q2: psychometric?.gad7?.responses?.[1],
        GAD7_Q3: psychometric?.gad7?.responses?.[2],
        GAD7_Q4: psychometric?.gad7?.responses?.[3],
        GAD7_Q5: psychometric?.gad7?.responses?.[4],
        GAD7_Q6: psychometric?.gad7?.responses?.[5],
        GAD7_Q7: psychometric?.gad7?.responses?.[6],

        PHQ9_Q1: psychometric?.phq9?.responses?.[0],
        PHQ9_Q2: psychometric?.phq9?.responses?.[1],
        PHQ9_Q3: psychometric?.phq9?.responses?.[2],
        PHQ9_Q4: psychometric?.phq9?.responses?.[3],
        PHQ9_Q5: psychometric?.phq9?.responses?.[4],
        PHQ9_Q6: psychometric?.phq9?.responses?.[5],
        PHQ9_Q7: psychometric?.phq9?.responses?.[6],
        PHQ9_Q8: psychometric?.phq9?.responses?.[7],
        PHQ9_Q9: psychometric?.phq9?.responses?.[8],

        Chronic_Condition: medical?.chronicConditions?.[0],
        Physical_Limitation: medical?.physicalLimitations?.[0]
      };
    }

    if (!payload) {
      return apiResponse.error(res, 'No assessment data or assessmentId provided', null, 400);
    }

    // Auto-create assessment document if missing
    if (!assessmentDoc) {
      const count = await WellnessAssessment.countDocuments({ user: req.user.id });
      assessmentDoc = await WellnessAssessment.create({
        user: req.user.id,
        assessmentNumber: count + 1,
        status: 'completed',
        currentStep: 11,
        completedAt: new Date()
      });
    } else {
      assessmentDoc.status = 'completed';
      assessmentDoc.completedAt = new Date();
      await assessmentDoc.save();
    }

    // 1. Invoke Wellness Assessment Agent
    const agentOutput = await runWellnessAssessmentAgent(payload);

    // Directly sync demographic inputs to UserProfile so Profile Page stays 100% up to date
    try {
      let userProf = await UserProfile.findOne({ user: req.user.id });
      if (!userProf) userProf = new UserProfile({ user: req.user.id });
      if (payload.Age) userProf.age = Number(payload.Age);
      if (payload.Gender) userProf.gender = String(payload.Gender).toLowerCase();
      if (payload.Height_cm) userProf.height = Number(payload.Height_cm);
      if (payload.Weight_kg) userProf.weight = Number(payload.Weight_kg);
      if (payload.Education_Level) userProf.education = payload.Education_Level;
      if (payload.Occupation) userProf.occupation = payload.Occupation;
      if (payload.Work_Pattern) userProf.workPattern = payload.Work_Pattern;
      await userProf.save();
    } catch (pErr) {
      console.warn('Profile sync error in evaluateWellness:', pErr);
    }

    // Save Wellness Result
    const wellnessResult = await WellnessResult.create({
      user: req.user.id,
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

    // 2. Generate Complete & Deeply Personalized Wellness Report
    const profile = await UserProfile.findOne({ user: req.user.id });
    const reportText = await generateWellnessReport(
      {
        overallWellBeingScore: agentOutput.mmwbi,
        wellnessCategory: agentOutput.userFacingRiskLabel || agentOutput.riskLevel,
        strengths: agentOutput.strengths,
        primaryConcerns: agentOutput.primaryConcerns
      },
      agentOutput.psychometricScores,
      {
        physicalActivity: { daysPerWeek: payload.Exercise_Days_Per_Week },
        sedentaryTime: { hoursSittingPerDay: payload.Sedentary_Hours_Daily },
        dietaryHabits: { generalDietQuality: payload.Dietary_Quality_0_10 > 7 ? 'Good' : 'Fair' }
      },
      {
        chronicConditions: payload.Chronic_Condition !== 'None' ? [payload.Chronic_Condition] : [],
        physicalLimitations: payload.Physical_Limitation !== 'None' ? [payload.Physical_Limitation] : []
      },
      profile,
      req.user,
      payload
    );

    // Save Wellness Report
    const wellnessReport = await WellnessReport.create({
      user: req.user.id,
      assessment: assessmentDoc._id,
      overallWellnessSummary: reportText.overallWellnessSummary,
      psychometricAssessmentSummary: reportText.psychometricAssessmentSummary,
      lifestyleInsights: reportText.lifestyleInsights,
      personalHealthContext: reportText.personalHealthContext,
      strengths: reportText.strengths,
      areasRequiringAttention: reportText.areasRequiringAttention,
      keyContributingFactors: reportText.keyContributingFactors,
      recommendedNextStep: reportText.recommendedNextStep
    });

    // 3. Pass Full Report & Domain Scores to Reasoning and Decision-Making Agent
    const reasoningContext = {
      report: wellnessReport,
      reportText: reportText,
      wellnessScore: agentOutput.mmwbi,
      wellnessCategory: agentOutput.riskLevel,
      riskLevel: agentOutput.riskLevel,
      mmwbi: agentOutput.mmwbi,
      domainScores: agentOutput.domainScores,
      psychometricScores: agentOutput.psychometricScores,
      attentionFlags: agentOutput.attentionFlags || [],
      safetyFlags: agentOutput.safetyFlags || [],
      primaryConcerns: agentOutput.primaryConcerns || [],
      physicalLimitations: [payload.Physical_Limitation].filter(l => l && l !== 'None'),
      rawFeaturePayload: agentOutput.rawFeaturePayload,
      completedAgents: []
    };
    const decision = await runReasoningAgent(reasoningContext);

    // 4. Create or update AgentJourney
    let journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' }).sort({ createdAt: -1 });
    if (!journey) {
      journey = await AgentJourney.create({
        user: req.user.id,
        assessment: assessmentDoc._id,
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

    // Save Progress record log
    await ProgressRecord.create({
      user: req.user.id,
      assessment: assessmentDoc._id,
      overallScore: agentOutput.mmwbi,
      wellnessCategory: agentOutput.riskLevel,
      domainScores: agentOutput.domainScores
    });

    return apiResponse.success(res, 'Wellness evaluation generated successfully', {
      result: wellnessResult,
      report: wellnessReport,
      journey,
      decision,
      agentOutput
    });
  } catch (error) {
    console.error('Error in evaluateWellness:', error);
    next(error);
  }
};

export const getLatestWellness = async (req, res, next) => {
  try {
    const latestResult = await WellnessResult.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    if (!latestResult) {
      return apiResponse.error(res, 'No wellness assessments completed yet', null, 404);
    }

    const latestReport = await WellnessReport.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });

    const latestJourney = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' })
      .sort({ createdAt: -1 });

    return apiResponse.success(res, 'Latest wellness results retrieved', {
      result: latestResult,
      report: latestReport,
      journey: latestJourney
    });
  } catch (error) {
    next(error);
  }
};
