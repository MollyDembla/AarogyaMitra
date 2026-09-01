/**
 * Recovery and Wellness Agent — Analysis Engine
 * Identifies patterns across dimensions, builds the Recovery Profile,
 * and determines primary/secondary concerns and contributing factors.
 */
import { RWI_LEVELS, DIMENSION_LEVELS, CONCERN_DIMENSION_MAP, SAFETY_ALERTNESS_THRESHOLD } from './constants.js';

// ── Helper: get level descriptor for a score ────────────────────────────────
export function getDimensionLevel(score) {
  for (const level of DIMENSION_LEVELS) {
    if (score >= level.min) return level;
  }
  return DIMENSION_LEVELS[DIMENSION_LEVELS.length - 1];
}

// ── Helper: get RWI level descriptor ────────────────────────────────────────
export function getRWILevel(rwi) {
  for (const level of RWI_LEVELS) {
    if (rwi >= level.min) return level;
  }
  return RWI_LEVELS[RWI_LEVELS.length - 1];
}

// ── Identify connected concern patterns ─────────────────────────────────────
export function identifyPatterns(dimensionScores, context) {
  const patterns = [];
  const raw = context.rawFeaturePayload || {};
  const psych = context.psychometricScores || {};

  const { sleepQuality, sleepDurationEfficiency, circadianRegularity,
          daytimeAlertness, fatigueRecoveryAdequacy, stressRecoveryBalance } = dimensionScores;

  // Pattern 1: Stress-driven recovery disruption
  if (stressRecoveryBalance < 55 && (sleepQuality < 60 || fatigueRecoveryAdequacy < 60)) {
    patterns.push({
      name: 'Stress-Driven Recovery Disruption',
      description: 'Elevated stress is likely cascading into reduced sleep quality and insufficient recovery.',
      dimensions: ['stressRecoveryBalance', 'sleepQuality', 'fatigueRecoveryAdequacy'],
      primaryFocus: 'stressRecoveryBalance'
    });
  }

  // Pattern 2: Circadian-sleep quality co-disruption
  if (circadianRegularity < 55 && sleepQuality < 60) {
    patterns.push({
      name: 'Circadian-Sleep Quality Co-Disruption',
      description: 'An irregular sleep-wake rhythm is contributing to consistently poor sleep quality.',
      dimensions: ['circadianRegularity', 'sleepQuality'],
      primaryFocus: 'circadianRegularity'
    });
  }

  // Pattern 3: Daytime fatigue cascade
  if (daytimeAlertness < 50 && fatigueRecoveryAdequacy < 55 && sleepDurationEfficiency < 60) {
    patterns.push({
      name: 'Daytime Fatigue Cascade',
      description: 'Insufficient sleep combined with poor recovery is resulting in significant daytime fatigue.',
      dimensions: ['daytimeAlertness', 'fatigueRecoveryAdequacy', 'sleepDurationEfficiency'],
      primaryFocus: 'sleepDurationEfficiency'
    });
  }

  // Pattern 4: Lifestyle-driven fatigue (sedentary + poor sleep)
  const sedentary = Number(raw.Sedentary_Hours_Daily ?? 0);
  if (sedentary >= 8 && fatigueRecoveryAdequacy < 65) {
    patterns.push({
      name: 'Sedentary-Fatigue Loop',
      description: 'High sedentary time combined with low physical activity is reducing overall energy and recovery capacity.',
      dimensions: ['fatigueRecoveryAdequacy'],
      primaryFocus: 'fatigueRecoveryAdequacy'
    });
  }

  return patterns;
}

// ── Identify contributing (risk) factors ────────────────────────────────────
export function identifyContributingFactors(dimensionScores, context) {
  const raw = context.rawFeaturePayload || {};
  const psych = context.psychometricScores || {};
  const factors = [];

  const screenTime = Number(raw.Screen_Time_Before_Bed_Hours ?? raw.Evening_Screen_Hours ?? 0);
  if (screenTime >= 2) factors.push(`High evening screen exposure (${screenTime}h before bed)`);

  const caffeine = raw.Caffeine_After_2pm || Number(raw.Caffeine_Servings_After_2pm ?? 0) > 0;
  if (caffeine) factors.push('Caffeine consumption in the afternoon or evening');

  const sedentary = Number(raw.Sedentary_Hours_Daily ?? 0);
  if (sedentary >= 9) factors.push(`Very high sedentary time (${sedentary}h/day)`);
  else if (sedentary >= 7) factors.push(`Elevated sedentary time (${sedentary}h/day)`);

  const activityMins = Number(raw.Physical_Activity_Minutes_Daily ?? 30);
  if (activityMins < 20) factors.push('Low physical activity levels reducing recovery capacity');

  const pssRaw = Number(psych.pss10?.rawScore ?? psych.pss10?.total ?? null);
  if (!isNaN(pssRaw) && pssRaw > 26) factors.push('High perceived stress (PSS-10 score)');
  else if (!isNaN(pssRaw) && pssRaw > 13) factors.push('Moderate perceived stress (PSS-10 score)');

  const gad7Sev = psych.gad7?.severity ?? 'None';
  if (gad7Sev === 'Severe' || gad7Sev === 'Moderate') {
    factors.push(`${gad7Sev} anxiety symptoms (GAD-7) contributing to sleep disruption`);
  }

  const workPattern = String(raw.Work_Pattern ?? '').toLowerCase();
  if (workPattern.includes('shift') || workPattern.includes('night')) {
    factors.push('Shift work or irregular work schedule disrupting circadian rhythm');
  }

  const sleepDuration = Number(raw.Sleep_Duration_Hours ?? 7);
  if (sleepDuration < 6) factors.push(`Very short sleep duration (${sleepDuration}h/night)`);
  else if (sleepDuration < 7) factors.push(`Below-optimal sleep duration (${sleepDuration}h/night)`);

  return factors.length > 0 ? factors : ['No major contributing factors identified in available data'];
}

// ── Identify protective (positive) factors ──────────────────────────────────
export function identifyProtectiveFactors(dimensionScores, context) {
  const raw = context.rawFeaturePayload || {};
  const psych = context.psychometricScores || {};
  const domainScores = context.domainScores || {};
  const factors = [];

  const activityMins = Number(raw.Physical_Activity_Minutes_Daily ?? 0);
  if (activityMins >= 30) factors.push(`Regular physical activity (${activityMins} min/day)`);

  const sleepDuration = Number(raw.Sleep_Duration_Hours ?? 0);
  if (sleepDuration >= 7 && sleepDuration <= 9) factors.push('Optimal sleep duration range maintained');

  const who5Pct = Number(psych.who5?.percentage ?? null);
  if (!isNaN(who5Pct) && who5Pct >= 60) factors.push('Good overall psychological well-being (WHO-5)');

  if (dimensionScores.circadianRegularity >= 70) factors.push('Relatively consistent sleep schedule');
  if (dimensionScores.sleepQuality >= 65) factors.push('Good self-reported sleep quality');
  if (dimensionScores.stressRecoveryBalance >= 65) factors.push('Healthy stress-recovery balance');

  const socialScore = Number(domainScores.socialWellbeing ?? 50);
  if (socialScore >= 65) factors.push('Good social well-being providing recovery support');

  return factors.length > 0 ? factors : ['Completing this assessment is a positive step toward improving your recovery.'];
}

// ── Build the full Recovery Profile ─────────────────────────────────────────
export function buildRecoveryProfile(dimensionScores, rwi, context) {
  const rwiLevel = getRWILevel(rwi);
  const patterns = identifyPatterns(dimensionScores, context);
  const contributingFactors = identifyContributingFactors(dimensionScores, context);
  const protectiveFactors = identifyProtectiveFactors(dimensionScores, context);

  // Rank dimensions by score ascending → highest need
  const ranked = Object.entries(dimensionScores)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => a.score - b.score);

  const primaryConcern = CONCERN_DIMENSION_MAP[ranked[0].key] || 'General recovery optimization';
  const secondaryConcerns = ranked
    .slice(1, 3)
    .filter(d => d.score < 70)
    .map(d => CONCERN_DIMENSION_MAP[d.key]);

  // Safety flag: significant daytime alertness deficit
  const alertnessSafetyFlag = dimensionScores.daytimeAlertness < SAFETY_ALERTNESS_THRESHOLD;

  // Build human-readable recovery summary
  const recoverySummary = buildRecoverySummary(dimensionScores, rwi, rwiLevel, patterns, context);

  return {
    rwi,
    rwiLevel: rwiLevel.label,
    rwiColor: rwiLevel.color,
    dimensionScores,
    primaryConcern,
    secondaryConcerns,
    contributingFactors,
    protectiveFactors,
    detectedPatterns: patterns,
    alertnessSafetyFlag,
    recoverySummary
  };
}

// ── Generate human-readable summary paragraph ───────────────────────────────
function buildRecoverySummary(dimensionScores, rwi, rwiLevel, patterns, context) {
  const { sleepQuality, circadianRegularity, stressRecoveryBalance, fatigueRecoveryAdequacy } = dimensionScores;
  const psych = context.psychometricScores || {};

  let summary = `Your Recovery and Wellness Index (RWI) is ${rwi}/100, indicating ${rwiLevel.label.toLowerCase()}. `;

  if (patterns.length > 0) {
    const topPattern = patterns[0];
    summary += `Analysis identifies a primary pattern of ${topPattern.name.toLowerCase()}: ${topPattern.description} `;
  } else {
    summary += 'No single dominant concern pattern was identified. ';
  }

  if (sleepQuality < 55) {
    summary += 'Sleep quality is a key area requiring attention. ';
  } else if (sleepQuality >= 75) {
    summary += 'Sleep quality is a relative strength in your recovery profile. ';
  }

  if (stressRecoveryBalance < 50) {
    summary += 'Stress-recovery balance is the most important priority for your wellness plan. ';
  }

  if (circadianRegularity < 55) {
    summary += 'Improving the consistency of your sleep-wake schedule may produce meaningful benefits across multiple dimensions. ';
  }

  summary += 'This assessment is a wellness indicator and does not constitute a clinical diagnosis. Please consult a healthcare professional for any persistent or significant concerns.';

  return summary;
}
