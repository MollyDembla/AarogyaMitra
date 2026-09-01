/**
 * Recovery and Wellness Agent — Scoring Engine
 * Each function takes a unified context object and returns a score 0–100.
 * Uses raw dataset features when available; falls back to ML domain scores.
 */
import {
  RWI_WEIGHTS,
  SLEEP_DURATION_REF,
  SLEEP_EFFICIENCY_REF,
  CIRCADIAN_PENALTIES,
  PSS_THRESHOLDS,
  WHO5_THRESHOLDS
} from './constants.js';

const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(val)));

// ─────────────────────────────────────────────────────────────────────────────
// 1. SLEEP QUALITY (0–100)
//    Sources: Sleep_Quality_1_10, WHO5 total, self-reported quality from raw payload
// ─────────────────────────────────────────────────────────────────────────────
export function scoreSleepQuality(ctx) {
  const raw = ctx.rawFeaturePayload || {};
  const psych = ctx.psychometricScores || {};

  // Primary: direct self-reported sleep quality 1–10 scale
  const sleepQualityRaw = Number(raw.Sleep_Quality_1_10 ?? raw.Sleep_Quality ?? null);
  if (!isNaN(sleepQualityRaw) && sleepQualityRaw > 0) {
    // Convert 1–10 → 0–100
    return clamp((sleepQualityRaw / 10) * 100);
  }

  // Secondary: estimate from WHO-5 well-being (item 3 "I have felt calm and relaxed" proxies sleep quality)
  const who5Total = Number(psych.who5?.rawScore ?? psych.who5?.total ?? null);
  if (!isNaN(who5Total) && who5Total >= 0) {
    // WHO-5 raw 0–25 → scale to 0–100 (well-being correlates with sleep quality)
    const who5Pct = (who5Total / 25) * 100;
    // Dampen slightly — WHO-5 is broader than sleep quality alone
    return clamp(who5Pct * 0.85 + 10);
  }

  // Tertiary: fall back to ML recovery wellness domain score
  const mlRecovery = Number(ctx.domainScores?.recoveryWellness ?? ctx.domainScores?.sleepRecovery ?? 55);
  return clamp(mlRecovery * 0.9);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SLEEP DURATION & EFFICIENCY (0–100)
//    Sources: Sleep_Duration_Hours, time-in-bed derived from bedtime/wake
// ─────────────────────────────────────────────────────────────────────────────
export function scoreSleepDurationEfficiency(ctx) {
  const raw = ctx.rawFeaturePayload || {};
  const ref = SLEEP_DURATION_REF;

  const sleepDuration = Number(raw.Sleep_Duration_Hours ?? raw.Average_Sleep_Hours ?? null);
  const latencyMins = Number(raw.Sleep_Latency_Minutes ?? 20); // default 20 min latency
  const awakenings = Number(raw.Night_Awakenings ?? 0);

  let durationScore = 70; // baseline
  if (!isNaN(sleepDuration) && sleepDuration > 0) {
    if (sleepDuration >= ref.optimal_min && sleepDuration <= ref.optimal_max) {
      durationScore = 100;
    } else if (sleepDuration < ref.optimal_min) {
      const deficit = ref.optimal_min - sleepDuration;
      durationScore = clamp(100 - deficit * ref.penalty_per_hour_short);
    } else if (sleepDuration > ref.optimal_max) {
      const excess = sleepDuration - ref.optimal_max;
      durationScore = clamp(100 - excess * ref.penalty_per_hour_long);
    }
  }

  // Estimate sleep efficiency from latency and awakenings
  // time_in_bed ≈ sleep_duration + latency/60 + awakenings*0.25h
  let efficiencyScore = 75; // baseline
  if (!isNaN(sleepDuration) && sleepDuration > 0) {
    const timeInBed = sleepDuration + latencyMins / 60 + awakenings * 0.25;
    const efficiency = (sleepDuration / timeInBed) * 100;
    if (efficiency >= SLEEP_EFFICIENCY_REF.excellent) efficiencyScore = 100;
    else if (efficiency >= SLEEP_EFFICIENCY_REF.good) efficiencyScore = 85;
    else if (efficiency >= SLEEP_EFFICIENCY_REF.moderate) efficiencyScore = 65;
    else if (efficiency >= SLEEP_EFFICIENCY_REF.low) efficiencyScore = 45;
    else efficiencyScore = 25;
  }

  // Composite: 60% duration + 40% efficiency
  return clamp(durationScore * 0.6 + efficiencyScore * 0.4);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CIRCADIAN REGULARITY (0–100)
//    Sources: screen time, caffeine, sleep schedule consistency, shift work
// ─────────────────────────────────────────────────────────────────────────────
export function scoreCircadianRegularity(ctx) {
  const raw = ctx.rawFeaturePayload || {};
  const pen = CIRCADIAN_PENALTIES;

  let score = 90; // start high, deduct for disrupting factors

  // Screen time before bed
  const screenTime = Number(raw.Screen_Time_Before_Bed_Hours ?? raw.Evening_Screen_Hours ?? null);
  if (!isNaN(screenTime)) {
    if (screenTime >= 3) score -= pen.very_high_screen_time;
    else if (screenTime >= 2) score -= pen.high_screen_time;
    else if (screenTime >= 1) score -= 5;
  }

  // Caffeine after 2pm
  const caffeineAfterNoon = raw.Caffeine_After_2pm === true || raw.Caffeine_After_2pm === 'Yes' ||
    Number(raw.Caffeine_Servings_After_2pm ?? 0) > 0;
  if (caffeineAfterNoon) score -= pen.caffeine_afternoon;

  // Sleep schedule inconsistency
  const sleepConsistency = Number(raw.Sleep_Schedule_Consistency_1_10 ?? raw.Sleep_Consistency ?? null);
  if (!isNaN(sleepConsistency) && sleepConsistency > 0) {
    // Low consistency → penalize
    if (sleepConsistency < 4) score -= 20;
    else if (sleepConsistency < 6) score -= 12;
    else if (sleepConsistency < 7) score -= 5;
  }

  // Shift work
  const workPattern = String(raw.Work_Pattern ?? ctx.rawFeaturePayload?.Work_Pattern ?? '').toLowerCase();
  if (workPattern.includes('shift') || workPattern.includes('night')) {
    score -= pen.shift_work;
  }

  // Sedentary time (high sedentary → weak circadian signal)
  const sedentary = Number(raw.Sedentary_Hours_Daily ?? 0);
  if (sedentary >= 10) score -= 10;
  else if (sedentary >= 8) score -= 5;

  return clamp(score);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DAYTIME ALERTNESS (0–100)
//    Sources: self-reported tiredness, PSS-10 stress, GAD-7 anxiety, WHO-5
// ─────────────────────────────────────────────────────────────────────────────
export function scoreDaytimeAlertness(ctx) {
  const raw = ctx.rawFeaturePayload || {};
  const psych = ctx.psychometricScores || {};

  // Direct daytime sleepiness self-report 1–10
  const tirednessRaw = Number(raw.Daytime_Tiredness_1_10 ?? raw.Daytime_Sleepiness ?? null);
  if (!isNaN(tirednessRaw) && tirednessRaw > 0) {
    // 1 = no tiredness (great alertness), 10 = very tired (poor alertness)
    return clamp(100 - (tirednessRaw - 1) * 11.1);
  }

  // Estimate from WHO-5 (low mood/energy → low alertness)
  const who5Pct = Number(psych.who5?.percentage ?? psych.who5?.pct ?? null);
  if (!isNaN(who5Pct) && who5Pct >= 0) {
    // WHO-5 % maps well to subjective energy/alertness
    return clamp(who5Pct * 0.9 + 5);
  }

  // Estimate from sleep duration + quality combination
  const sleepDuration = Number(raw.Sleep_Duration_Hours ?? 7);
  const sleepQuality = Number(raw.Sleep_Quality_1_10 ?? 5);
  const combined = ((sleepDuration / 9) * 50) + ((sleepQuality / 10) * 50);
  return clamp(combined * 0.85 + 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FATIGUE & RECOVERY ADEQUACY (0–100)
//    Sources: physical activity, sedentary behavior, WHO-5 energy items
// ─────────────────────────────────────────────────────────────────────────────
export function scoreFatigueRecoveryAdequacy(ctx) {
  const raw = ctx.rawFeaturePayload || {};
  const psych = ctx.psychometricScores || {};
  const domainScores = ctx.domainScores || {};

  // Direct fatigue rating 1–10
  const fatigueRaw = Number(raw.Physical_Fatigue_1_10 ?? raw.Fatigue_Level ?? null);
  if (!isNaN(fatigueRaw) && fatigueRaw > 0) {
    // 1 = no fatigue, 10 = extreme fatigue
    return clamp(100 - (fatigueRaw - 1) * 11.1);
  }

  // Composite from physical health domain + lifestyle balance domain + WHO-5
  const physScore = Number(domainScores.physicalHealth ?? domainScores.physicalActivity ?? 60);
  const lifeScore = Number(domainScores.lifestyleBalance ?? domainScores.lifestyle ?? 60);
  const who5Pct = Number(psych.who5?.percentage ?? 60);

  // Physical activity buffer
  const activityMins = Number(raw.Physical_Activity_Minutes_Daily ?? 30);
  const activityBonus = activityMins >= 30 ? 5 : activityMins >= 20 ? 2 : -5;

  // Sedentary penalty
  const sedentary = Number(raw.Sedentary_Hours_Daily ?? 6);
  const sedentaryPenalty = sedentary >= 10 ? 10 : sedentary >= 8 ? 5 : 0;

  const base = (physScore * 0.35 + lifeScore * 0.30 + who5Pct * 0.35);
  return clamp(base + activityBonus - sedentaryPenalty);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. STRESS-RECOVERY BALANCE (0–100)
//    Sources: PSS-10, GAD-7 severity, stressResilience domain score
// ─────────────────────────────────────────────────────────────────────────────
export function scoreStressRecoveryBalance(ctx) {
  const psych = ctx.psychometricScores || {};
  const domainScores = ctx.domainScores || {};
  const raw = ctx.rawFeaturePayload || {};

  // PSS-10 raw score (0–40), lower = better stress management
  const pssRaw = Number(psych.pss10?.rawScore ?? psych.pss10?.total ?? null);
  if (!isNaN(pssRaw) && pssRaw >= 0) {
    // Invert: 0 stress = 100, 40 max stress = 0
    const pssScore = clamp(100 - (pssRaw / 40) * 100);
    // Blend with stress resilience domain from ML model
    const stressResil = Number(domainScores.stressResilience ?? 50);
    return clamp(pssScore * 0.6 + stressResil * 0.4);
  }

  // Fall back to ML stressResilience domain score
  const stressResil = Number(domainScores.stressResilience ?? 50);
  const psych_score = Number(domainScores.psychologicalWellbeing ?? domainScores.psychological ?? 50);

  // GAD-7 severity adjustment
  const gad7Sev = psych.gad7?.severity ?? 'None';
  let gadPenalty = 0;
  if (gad7Sev === 'Severe') gadPenalty = 20;
  else if (gad7Sev === 'Moderate') gadPenalty = 12;
  else if (gad7Sev === 'Mild') gadPenalty = 6;

  return clamp((stressResil * 0.5 + psych_score * 0.5) - gadPenalty);
}

// ─────────────────────────────────────────────────────────────────────────────
// RWI COMPOSITE CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
export function calculateRWI(dimensionScores) {
  const w = RWI_WEIGHTS;
  const rwi =
    dimensionScores.sleepQuality            * w.sleepQuality +
    dimensionScores.sleepDurationEfficiency * w.sleepDurationEfficiency +
    dimensionScores.circadianRegularity     * w.circadianRegularity +
    dimensionScores.daytimeAlertness        * w.daytimeAlertness +
    dimensionScores.fatigueRecoveryAdequacy * w.fatigueRecoveryAdequacy +
    dimensionScores.stressRecoveryBalance   * w.stressRecoveryBalance;
  return clamp(Math.round(rwi * 10) / 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER SCORING FUNCTION: runs all 6 dimensions + RWI
// ─────────────────────────────────────────────────────────────────────────────
export function runAllScorers(context) {
  const dimensionScores = {
    sleepQuality:            scoreSleepQuality(context),
    sleepDurationEfficiency: scoreSleepDurationEfficiency(context),
    circadianRegularity:     scoreCircadianRegularity(context),
    daytimeAlertness:        scoreDaytimeAlertness(context),
    fatigueRecoveryAdequacy: scoreFatigueRecoveryAdequacy(context),
    stressRecoveryBalance:   scoreStressRecoveryBalance(context)
  };
  const rwi = calculateRWI(dimensionScores);
  return { dimensionScores, rwi };
}
