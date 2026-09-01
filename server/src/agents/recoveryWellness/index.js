/**
 * Recovery and Wellness Agent — Main Entry Point
 * Orchestrates: scoringEngine → analysisEngine → recommendationEngine
 * Accepts full WellnessResult/Report context from the main AarogyaMitra system.
 */
import { runAllScorers } from './scoringEngine.js';
import { buildRecoveryProfile } from './analysisEngine.js';
import { generateRecommendations } from './recommendationEngine.js';
import { generateRoutinePlan } from './routinePlanEngine.js';

/**
 * runRecoveryWellnessAgent
 * @param {Object} context - Full wellness context from AarogyaMitra system
 * @returns {Object} Structured Recovery and Wellness Agent output
 */
export const runRecoveryWellnessAgent = async (context = {}) => {
  // Normalize context: merge result fields for easy access
  const normalizedContext = {
    domainScores: context.domainScores || context.result?.domainScores || {},
    psychometricScores: context.psychometricScores || context.result?.psychometricScores || {},
    rawFeaturePayload: context.rawFeaturePayload || context.result?.rawFeaturePayload || {},
    riskLevel: context.riskLevel || context.result?.wellnessCategory || 'Moderate Risk',
    mmwbi: context.mmwbi || context.result?.overallWellBeingScore || 60,
    attentionFlags: context.attentionFlags || context.result?.attentionFlags || [],
    safetyFlags: context.safetyFlags || context.result?.safetyFlags || [],
    primaryConcerns: context.primaryConcerns || context.result?.primaryConcerns || [],
    report: context.report || {},
    userName: context.userName || context.firstName || ''
  };

  // Step 1: Score all 6 recovery dimensions + calculate RWI
  const { dimensionScores, rwi } = runAllScorers(normalizedContext);

  // Step 2: Build multi-dimensional Recovery Profile
  const recoveryProfile = buildRecoveryProfile(dimensionScores, rwi, normalizedContext);

  // Step 3: Generate personalized 4-category recommendations
  const recommendations = generateRecommendations(recoveryProfile, normalizedContext);

  // Step 4: Generate adaptive routine improvement plan (considering exceptional conditions)
  const exceptionalConditions = context.exceptionalConditions || '';
  const routinePlan = await generateRoutinePlan(recoveryProfile, normalizedContext, exceptionalConditions);

  // Step 5: Determine next action for Reasoning Agent
  const nextAction = determineNextAction(recoveryProfile, normalizedContext);

  return {
    recoveryWellnessIndex: rwi,
    overallRecoveryLevel: recoveryProfile.rwiLevel,
    rwiColor: recoveryProfile.rwiColor,

    dimensionScores,
    dimensionLevels: getDimensionLevels(dimensionScores),

    primaryConcern: recoveryProfile.primaryConcern,
    secondaryConcerns: recoveryProfile.secondaryConcerns,

    contributingFactors: recoveryProfile.contributingFactors,
    protectiveFactors: recoveryProfile.protectiveFactors,
    detectedPatterns: recoveryProfile.detectedPatterns,

    recoverySummary: recoveryProfile.recoverySummary,
    exceptionalConditions,
    routinePlan,

    personalizedRecommendations: {
      sleepHygiene: recommendations.sleepHygiene,
      recoveryGuidance: recommendations.recoveryGuidance,
      stressManagement: recommendations.stressManagement,
      ayushWellnessGuidance: recommendations.ayushWellnessGuidance
    },

    followUpQuestions: recommendations.followUpQuestions,

    alertnessSafetyFlag: recoveryProfile.alertnessSafetyFlag,
    safetyMessage: recoveryProfile.alertnessSafetyFlag
      ? 'Your daytime alertness scores suggest significant fatigue. If you experience excessive sleepiness affecting daily safety (e.g. driving), please consult a healthcare professional.'
      : null,

    nextAction,

    metadata: {
      agentName: 'Recovery and Wellness Agent',
      generatedAt: new Date().toISOString(),
      disclaimer: 'The Recovery and Wellness Index (RWI) is a prototype wellness assessment indicator. It does not constitute a clinical diagnosis and does not replace qualified healthcare professionals. For persistent concerns, please seek professional evaluation.'
    }
  };
};

// ── Determine next recommended action for Reasoning Agent ───────────────────
function determineNextAction(profile, context) {
  if (profile.alertnessSafetyFlag) {
    return 'Navigate to Professional Support Pathway for daytime alertness evaluation guidance.';
  }
  if (profile.rwi < 40) {
    return 'Schedule follow-up check-in in 7 days. Priority: sleep schedule regularization and stress reduction.';
  }
  if (profile.rwi < 60) {
    return 'Begin implementing sleep hygiene and stress-recovery recommendations. Check-in in 14 days.';
  }
  return 'Continue monitoring. Return for re-assessment in 30 days or if recovery concerns worsen.';
}

// ── Map dimension scores to level descriptors ────────────────────────────────
function getDimensionLevels(dimensionScores) {
  const levels = {};
  for (const [key, score] of Object.entries(dimensionScores)) {
    if (score >= 80) levels[key] = { label: 'Strong', color: 'emerald' };
    else if (score >= 65) levels[key] = { label: 'Good', color: 'teal' };
    else if (score >= 50) levels[key] = { label: 'Moderate', color: 'amber' };
    else if (score >= 35) levels[key] = { label: 'Low', color: 'orange' };
    else levels[key] = { label: 'Critical', color: 'red' };
  }
  return levels;
}
