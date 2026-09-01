import WellnessAssessment from '../models/WellnessAssessment.js';
import PsychometricAssessment from '../models/PsychometricAssessment.js';
import LifestyleBehavioralInput from '../models/LifestyleBehavioralInput.js';
import MedicalHealthProfile from '../models/MedicalHealthProfile.js';
import UserProfile from '../models/UserProfile.js';
import { apiResponse } from '../utils/apiResponse.js';
import { scoreWHO5, scorePSS10, scoreGAD7, scorePHQ9 } from '../utils/questionnaire.js';

export const startAssessment = async (req, res, next) => {
  try {
    const activeDraft = await WellnessAssessment.findOne({ user: req.user.id, status: 'draft' });
    if (activeDraft) {
      return apiResponse.success(res, 'Active draft assessment found', activeDraft);
    }

    const count = await WellnessAssessment.countDocuments({ user: req.user.id });
    const assessment = await WellnessAssessment.create({
      user: req.user.id,
      assessmentNumber: count + 1,
      status: 'draft',
      currentStep: 1
    });

    return apiResponse.success(res, 'New assessment started', assessment, 201);
  } catch (error) {
    next(error);
  }
};

export const submitPersonalInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { age, gender, height, weight, education, occupation, workPattern } = req.body;

    const assessment = await WellnessAssessment.findOne({ _id: id, user: req.user.id });
    if (!assessment) {
      return apiResponse.error(res, 'Assessment not found', null, 404);
    }

    // Update main UserProfile
    let profile = await UserProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new UserProfile({ user: req.user.id });
    }
    profile.age = age;
    profile.gender = gender;
    profile.height = height;
    profile.weight = weight;
    profile.education = education;
    profile.occupation = occupation;
    profile.workPattern = workPattern;
    await profile.save();

    assessment.currentStep = 2;
    await assessment.save();

    return apiResponse.success(res, 'Personal information saved', { assessment, profile });
  } catch (error) {
    next(error);
  }
};

export const submitPsychometric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { who5Responses, pss10Responses, gad7Responses, phq9Responses } = req.body;

    const assessment = await WellnessAssessment.findOne({ _id: id, user: req.user.id });
    if (!assessment) {
      return apiResponse.error(res, 'Assessment not found', null, 404);
    }

    // Build update object — only include scales whose responses were provided
    // This allows partial saves as the user progresses section by section.
    const psychUpdate = { user: req.user.id, assessment: id };
    const scaleScores = {};

    if (Array.isArray(who5Responses) && who5Responses.every(v => v !== null)) {
      const r = scoreWHO5(who5Responses);
      psychUpdate.who5 = { responses: who5Responses, score: r.rawScore };
      scaleScores.who5 = { rawScore: r.rawScore, percentage: r.percentageScore };
    }
    if (Array.isArray(pss10Responses) && pss10Responses.every(v => v !== null)) {
      const r = scorePSS10(pss10Responses);
      psychUpdate.pss10 = { responses: pss10Responses, score: r.totalScore };
      scaleScores.pss10 = { totalScore: r.totalScore, severity: r.severity };
    }
    if (Array.isArray(gad7Responses) && gad7Responses.every(v => v !== null)) {
      const r = scoreGAD7(gad7Responses);
      psychUpdate.gad7 = { responses: gad7Responses, score: r.totalScore };
      scaleScores.gad7 = { totalScore: r.totalScore, severity: r.severity };
    }
    if (Array.isArray(phq9Responses) && phq9Responses.every(v => v !== null)) {
      const r = scorePHQ9(phq9Responses);
      psychUpdate.phq9 = { responses: phq9Responses, score: r.totalScore };
      scaleScores.phq9 = { totalScore: r.totalScore, severity: r.severity };
    }

    // Upsert the psychometric document
    let psych = await PsychometricAssessment.findOne({ assessment: id });
    if (psych) {
      Object.assign(psych, psychUpdate);
      await psych.save();
    } else {
      psych = await PsychometricAssessment.create(psychUpdate);
    }

    assessment.psychometricAssessment = psych._id;
    // Advance step only if all 4 scales are now complete
    const allComplete =
      psych.who5?.responses?.length === 5 &&
      psych.pss10?.responses?.length === 10 &&
      psych.gad7?.responses?.length === 7 &&
      psych.phq9?.responses?.length === 9;
    if (allComplete) assessment.currentStep = 3;
    await assessment.save();

    return apiResponse.success(res, 'Psychometric data saved', { psych, scaleScores, allComplete });
  } catch (error) {
    next(error);
  }
};

export const submitLifestyle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { physicalActivity, sedentaryTime, dietaryHabits, screenTime, substanceUse } = req.body;

    const assessment = await WellnessAssessment.findOne({ _id: id, user: req.user.id });
    if (!assessment) {
      return apiResponse.error(res, 'Assessment not found', null, 404);
    }

    const lifestyleData = {
      user: req.user.id,
      assessment: id,
      physicalActivity,
      sedentaryTime,
      dietaryHabits,
      screenTime,
      substanceUse
    };

    let lifestyle = await LifestyleBehavioralInput.findOne({ assessment: id });
    if (lifestyle) {
      Object.assign(lifestyle, lifestyleData);
      await lifestyle.save();
    } else {
      lifestyle = await LifestyleBehavioralInput.create(lifestyleData);
    }

    assessment.lifestyleBehavioralInput = lifestyle._id;
    assessment.currentStep = 4;
    await assessment.save();

    return apiResponse.success(res, 'Lifestyle patterns saved', lifestyle);
  } catch (error) {
    next(error);
  }
};

export const submitMedical = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { chronicConditions, currentMedications, previousDiagnoses, allergies, physicalLimitations, physiologicalBiomarkers } = req.body;

    const assessment = await WellnessAssessment.findOne({ _id: id, user: req.user.id });
    if (!assessment) {
      return apiResponse.error(res, 'Assessment not found', null, 404);
    }

    const medicalData = {
      user: req.user.id,
      assessment: id,
      chronicConditions,
      currentMedications,
      previousDiagnoses,
      allergies,
      physicalLimitations,
      physiologicalBiomarkers
    };

    let medical = await MedicalHealthProfile.findOne({ assessment: id });
    if (medical) {
      Object.assign(medical, medicalData);
      await medical.save();
    } else {
      medical = await MedicalHealthProfile.create(medicalData);
    }

    assessment.medicalHealthProfile = medical._id;
    assessment.currentStep = 5;
    assessment.status = 'submitted';
    assessment.submittedAt = new Date();
    await assessment.save();

    return apiResponse.success(res, 'Medical context saved and assessment submitted', { assessment, medical });
  } catch (error) {
    next(error);
  }
};

export const getAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await WellnessAssessment.findOne({ _id: id, user: req.user.id })
      .populate('psychometricAssessment')
      .populate('lifestyleBehavioralInput')
      .populate('medicalHealthProfile');

    if (!assessment) {
      return apiResponse.error(res, 'Assessment not found', null, 404);
    }
    return apiResponse.success(res, 'Assessment retrieved', assessment);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentHistory = async (req, res, next) => {
  try {
    const history = await WellnessAssessment.find({ user: req.user.id, status: 'completed' })
      .sort({ createdAt: -1 });
    return apiResponse.success(res, 'Assessment history retrieved', history);
  } catch (error) {
    next(error);
  }
};
