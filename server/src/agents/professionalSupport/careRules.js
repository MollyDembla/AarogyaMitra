/**
 * Deterministic Care Level Rules for Professional Care Navigation Agent.
 * NEVER allow an LLM to override these rules.
 * Uses MMWBI, psychometric scores, recovery scores, safety flags, and functional impact.
 */

export const CARE_LEVELS = {
  WELLNESS_SUPPORT: 1,
  PROFESSIONAL_RECOMMENDED: 2,
  URGENT_SUPPORT: 3,
  CRISIS_EMERGENCY: 4
};

export const CARE_LEVEL_LABELS = {
  1: { label: 'Wellness Support', urgency: 'Routine', color: '#16a34a', bg: '#f0fdf4' },
  2: { label: 'Professional Support Recommended', urgency: 'Soon', color: '#d97706', bg: '#fffbeb' },
  3: { label: 'Urgent Professional Support', urgency: 'Prompt', color: '#dc2626', bg: '#fef2f2' },
  4: { label: 'Immediate Support', urgency: 'Immediate', color: '#7f1d1d', bg: '#fef2f2' }
};

/**
 * Evaluate care level from full wellness context.
 * Uses multiple factors — NEVER a single score alone.
 *
 * @param {object} context
 * @returns {{ careLevel, reason, factors }}
 */
export function evaluateCareLevel(context = {}) {
  const {
    mmwbi, domainScores = {}, psychometricScores = {},
    primaryConcerns = [], safetyFlags = [], attentionFlags = [],
    recoveryScore, previousCareRecommendations = []
  } = context;

  const gadScore = psychometricScores?.gad7?.score ?? 0;
  const phqScore = psychometricScores?.phq9?.score ?? 0;
  const pssScore = psychometricScores?.pss10?.score ?? 0;
  const who5Score = psychometricScores?.who5?.score != null
    ? psychometricScores.who5.score * 4 : 100; // 0-100%

  const factors = [];

  // ── LEVEL 4: Crisis / Emergency ────────────────────────────────────────
  const hasSafetyFlag = safetyFlags.some(f =>
    typeof f === 'string' && (f.toLowerCase().includes('crisis') || f.toLowerCase().includes('safety'))
  );
  if (hasSafetyFlag) {
    return {
      careLevel: CARE_LEVELS.CRISIS_EMERGENCY,
      factors: ['Active safety flag detected in wellness assessment'],
      reason: 'A safety concern has been detected in your assessment responses. Immediate support resources are available.'
    };
  }

  // ── LEVEL 3: Urgent Support ────────────────────────────────────────────
  const severeSymptoms = (phqScore >= 20) || (gadScore >= 15) || (who5Score < 28);
  const criticalMmwbi = mmwbi && mmwbi < 35;
  const highStress = pssScore >= 34;

  if (severeSymptoms || criticalMmwbi) {
    if (phqScore >= 20) factors.push(`PHQ-9 score indicates severe depression symptoms (${phqScore}/27)`);
    if (gadScore >= 15) factors.push(`GAD-7 score indicates severe anxiety symptoms (${gadScore}/21)`);
    if (who5Score < 28) factors.push(`WHO-5 well-being is very low (${who5Score}%)`);
    if (criticalMmwbi) factors.push(`Overall wellness index is critically low (${mmwbi}/100)`);

    if (factors.length >= 2 || (factors.length === 1 && criticalMmwbi)) {
      return {
        careLevel: CARE_LEVELS.URGENT_SUPPORT,
        factors,
        reason: `Multiple indicators suggest significant psychological and wellness distress that warrants prompt professional evaluation: ${factors.join('; ')}.`
      };
    }
  }

  // ── LEVEL 2: Professional Recommended ─────────────────────────────────
  const moderateSymptoms = (phqScore >= 10) || (gadScore >= 10) || (who5Score < 52) || (pssScore >= 27);
  const moderateMmwbi = mmwbi && mmwbi < 55;
  const persistentConcerns = primaryConcerns.length >= 3;
  const previousRecommendation = previousCareRecommendations.length > 0;
  const lowRecovery = recoveryScore && recoveryScore < 45;

  const level2Factors = [];
  if (phqScore >= 10) level2Factors.push(`Moderate-to-severe depression screening score (PHQ-9: ${phqScore}/27)`);
  if (gadScore >= 10) level2Factors.push(`Moderate-to-severe anxiety screening score (GAD-7: ${gadScore}/21)`);
  if (who5Score < 52) level2Factors.push(`Reduced mental well-being (WHO-5: ${who5Score}%)`);
  if (pssScore >= 27) level2Factors.push(`High perceived stress (PSS-10: ${pssScore}/40)`);
  if (moderateMmwbi) level2Factors.push(`Below-average overall wellness index (${mmwbi}/100)`);
  if (persistentConcerns) level2Factors.push(`Multiple wellness concerns identified (${primaryConcerns.slice(0, 2).join(', ')})`);
  if (lowRecovery) level2Factors.push(`Low recovery wellness index (${recoveryScore}/100)`);

  if (level2Factors.length >= 2 || moderateMmwbi) {
    return {
      careLevel: CARE_LEVELS.PROFESSIONAL_RECOMMENDED,
      factors: level2Factors,
      reason: `Your assessment indicates persistent wellness difficulties that may benefit from professional support: ${level2Factors.slice(0, 3).join('; ')}.`
    };
  }

  // ── LEVEL 1: Wellness Support ──────────────────────────────────────────
  return {
    careLevel: CARE_LEVELS.WELLNESS_SUPPORT,
    factors: ['Mild concerns identified — wellness support is appropriate at this stage'],
    reason: 'Your current assessment suggests that wellness support and monitoring through AarogyaMitra is appropriate. Continue engaging with the specialized agents and reassess regularly.'
  };
}

/**
 * Determine the next steps based on care level.
 */
export function getCareNextSteps(careLevel) {
  if (careLevel === CARE_LEVELS.CRISIS_EMERGENCY) {
    return [
      'Please reach out to a crisis helpline immediately (KIRAN: 1800-599-0019)',
      'Contact a trusted person — a friend, family member, or colleague',
      'If in immediate danger, call emergency services (112)',
      'Do not be alone — move to a safe space with others',
      'You can contact our verified crisis resources below'
    ];
  }
  if (careLevel === CARE_LEVELS.URGENT_SUPPORT) {
    return [
      'Schedule a consultation with a qualified mental health professional this week',
      'Share your AarogyaMitra wellness summary with the professional',
      'Continue daily wellness check-ins through AarogyaMitra',
      'Avoid making major life decisions during this period',
      'Use crisis resources if your symptoms worsen or you feel unsafe'
    ];
  }
  if (careLevel === CARE_LEVELS.PROFESSIONAL_RECOMMENDED) {
    return [
      'Consider scheduling a consultation with a psychologist or counselor',
      'Continue your wellness journey through AarogyaMitra specialized agents',
      'Track your mood and energy daily using the Psychological Support module',
      'Prepare a list of your main concerns before your professional consultation',
      'If symptoms worsen, move to prompt professional support'
    ];
  }
  return [
    'Continue engaging with AarogyaMitra specialized agents',
    'Complete another assessment in 2–4 weeks to track progress',
    'Use the Psychological Support Agent for ongoing emotional wellness',
    'Maintain your recovery routines through the Recovery & Wellness Agent'
  ];
}
