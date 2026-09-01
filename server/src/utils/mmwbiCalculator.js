/**
 * Multimodal Mental Well-Being Index (MMWBI) Calculator
 * Deterministic weighted formula and explainable breakdown based on the 6 domain scores.
 */

export const MMWBI_WEIGHTS = {
  physicalHealth: 0.15,
  recoveryWellness: 0.18,
  psychologicalWellbeing: 0.23,
  socialWellbeing: 0.14,
  lifestyleBalance: 0.16,
  stressResilience: 0.14
};

/**
 * Calculate MMWBI and provide complete contribution breakdown
 * @param {Object} domainScores - Object containing domain scores (0-100)
 * @returns {Object} Complete MMWBI breakdown and risk levels
 */
export function calculateMMWBI(domainScores = {}) {
  const physical = Math.max(0, Math.min(100, Number(domainScores.physicalHealth ?? domainScores.Physical_Health_Score ?? 50)));
  const recovery = Math.max(0, Math.min(100, Number(domainScores.recoveryWellness ?? domainScores.Sleep_Recovery_Score ?? 50)));
  const psychological = Math.max(0, Math.min(100, Number(domainScores.psychologicalWellbeing ?? domainScores.Psychological_Wellbeing_Score ?? 50)));
  const social = Math.max(0, Math.min(100, Number(domainScores.socialWellbeing ?? domainScores.Social_Wellbeing_Score ?? 50)));
  const lifestyle = Math.max(0, Math.min(100, Number(domainScores.lifestyleBalance ?? domainScores.Lifestyle_Balance_Score ?? 50)));
  const stress = Math.max(0, Math.min(100, Number(domainScores.stressResilience ?? domainScores.Stress_Profile_Score ?? 50)));

  const physContrib = Number((physical * MMWBI_WEIGHTS.physicalHealth).toFixed(2));
  const recContrib = Number((recovery * MMWBI_WEIGHTS.recoveryWellness).toFixed(2));
  const psychContrib = Number((psychological * MMWBI_WEIGHTS.psychologicalWellbeing).toFixed(2));
  const socContrib = Number((social * MMWBI_WEIGHTS.socialWellbeing).toFixed(2));
  const lifeContrib = Number((lifestyle * MMWBI_WEIGHTS.lifestyleBalance).toFixed(2));
  const stressContrib = Number((stress * MMWBI_WEIGHTS.stressResilience).toFixed(2));

  let rawMMWBI = physContrib + recContrib + psychContrib + socContrib + lifeContrib + stressContrib;
  rawMMWBI = Math.max(0, Math.min(100, rawMMWBI));
  const mmwbi = Number(rawMMWBI.toFixed(2));

  let internalRiskLevel = "Mild Risk";
  let userFacingRiskLabel = "Mild Attention Needed";

  if (mmwbi >= 80) {
    internalRiskLevel = "Optimal";
    userFacingRiskLabel = "Optimal Well-Being";
  } else if (mmwbi >= 60) {
    internalRiskLevel = "Mild Risk";
    userFacingRiskLabel = "Mild Attention Needed";
  } else if (mmwbi >= 40) {
    internalRiskLevel = "Moderate Risk";
    userFacingRiskLabel = "Moderate Attention Needed";
  } else if (mmwbi >= 20) {
    internalRiskLevel = "High Risk";
    userFacingRiskLabel = "High Attention Needed";
  } else {
    internalRiskLevel = "Critical Risk";
    userFacingRiskLabel = "Professional Support Recommended";
  }

  return {
    mmwbi,
    internalRiskLevel,
    userFacingRiskLabel,
    breakdown: {
      physicalHealth: {
        score: physical,
        weight: MMWBI_WEIGHTS.physicalHealth,
        contribution: physContrib
      },
      recoveryWellness: {
        score: recovery,
        weight: MMWBI_WEIGHTS.recoveryWellness,
        contribution: recContrib
      },
      psychologicalWellbeing: {
        score: psychological,
        weight: MMWBI_WEIGHTS.psychologicalWellbeing,
        contribution: psychContrib
      },
      socialWellbeing: {
        score: social,
        weight: MMWBI_WEIGHTS.socialWellbeing,
        contribution: socContrib
      },
      lifestyleBalance: {
        score: lifestyle,
        weight: MMWBI_WEIGHTS.lifestyleBalance,
        contribution: lifeContrib
      },
      stressResilience: {
        score: stress,
        weight: MMWBI_WEIGHTS.stressResilience,
        contribution: stressContrib
      },
      mmwbi
    }
  };
}
