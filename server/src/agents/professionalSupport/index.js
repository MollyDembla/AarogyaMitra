import { evaluateCareLevel, getCareNextSteps, CARE_LEVELS, CARE_LEVEL_LABELS } from './careRules.js';
import { determineProfessionalType } from './professionalTypeRules.js';
import { getResourcesForCareLevel, CRISIS_RESOURCES, EMERGENCY_RESOURCE } from './resourceDatabase.js';

/**
 * Professional Care Navigation Agent — Full Implementation.
 * Completely rule-based and deterministic.
 */
export const runProfessionalSupportPathway = async (context = {}) => {
  // Aggregate context
  const {
    mmwbi, domainScores = {}, psychometricScores = {},
    primaryConcerns = [], safetyFlags = [], attentionFlags = [],
    recoveryScore, previousCareRecommendations = [],
    userPreference, firstName = 'there'
  } = context;

  // ── STEP 1: Evaluate Care Level (deterministic) ─────────────────────────
  const { careLevel, factors, reason } = evaluateCareLevel(context);
  const careLevelInfo = CARE_LEVEL_LABELS[careLevel];

  // ── STEP 2: Determine Professional Type ────────────────────────────────
  const professionalTypeResult = determineProfessionalType(context, careLevel);

  // ── STEP 3: Get Verified Resources ────────────────────────────────────
  const resources = getResourcesForCareLevel(careLevel);

  // ── STEP 4: Build Next Steps ───────────────────────────────────────────
  const nextSteps = getCareNextSteps(careLevel);

  // ── STEP 5: Urgency Description ───────────────────────────────────────
  const urgencyDescriptions = {
    1: 'Your current wellness profile suggests that ongoing wellness monitoring and support is the appropriate approach at this time. Continue engaging with the specialized agents.',
    2: 'Based on multiple wellness indicators, speaking with a qualified professional in the coming weeks is recommended. This is not an emergency, but timely support would be beneficial.',
    3: 'Your assessment suggests significant wellness difficulties. Seeking professional support promptly — within the next few days — is advisable.',
    4: 'A crisis indicator has been identified. Please reach out to crisis support resources or emergency services immediately.'
  };

  // ── STEP 6: Context Summary for Display ───────────────────────────────
  const contextSummary = {
    mmwbi: mmwbi ? `${mmwbi}/100` : 'Not available',
    gadSeverity: psychometricScores?.gad7?.severity || 'Not assessed',
    phqSeverity: psychometricScores?.phq9?.severity || 'Not assessed',
    who5Percentage: psychometricScores?.who5?.score != null
      ? `${psychometricScores.who5.score * 4}%` : 'Not assessed',
    pssScore: psychometricScores?.pss10?.score != null
      ? `${psychometricScores.pss10.score}/40` : 'Not assessed',
    recoveryScore: recoveryScore ? `${recoveryScore}/100` : 'Not assessed',
    primaryConcerns: primaryConcerns.slice(0, 3)
  };

  return {
    careLevel,
    careLevelLabel: careLevelInfo.label,
    urgency: careLevelInfo.urgency,
    urgencyColor: careLevelInfo.color,
    urgencyDescription: urgencyDescriptions[careLevel],
    reason,
    factors,
    professionalType: professionalTypeResult.primaryType,
    alternativeProfessionalType: professionalTypeResult.alternativeType,
    professionalTypeReasoning: professionalTypeResult.reasoning,
    professionalDescriptions: professionalTypeResult.description,
    nextSteps,
    resources,
    crisisResources: CRISIS_RESOURCES,
    emergencyResource: EMERGENCY_RESOURCE,
    contextSummary,
    alwaysShowCrisis: true,
    safetyDisclaimer: 'AarogyaMitra is a wellness companion and does NOT diagnose clinical conditions or prescribe treatments. These recommendations are based on wellness screening and should not replace a formal clinical evaluation.',
    timestamp: new Date().toISOString()
  };
};
