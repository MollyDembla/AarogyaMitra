/**
 * Recovery and Wellness Agent — Configuration Constants
 * All weights, thresholds, and labels are stored here so they can be tuned
 * without touching any scoring or reasoning logic.
 */

// ── RWI Dimension Weights (must sum to 1.0) ─────────────────────────────────
export const RWI_WEIGHTS = {
  sleepQuality: 0.20,
  sleepDurationEfficiency: 0.20,
  circadianRegularity: 0.15,
  daytimeAlertness: 0.15,
  fatigueRecoveryAdequacy: 0.15,
  stressRecoveryBalance: 0.15
};

// ── RWI Score Level Thresholds ───────────────────────────────────────────────
export const RWI_LEVELS = [
  { min: 80, max: 100, label: 'Excellent Recovery',                    color: 'emerald', priority: 1 },
  { min: 65, max: 79,  label: 'Good Recovery',                         color: 'teal',    priority: 2 },
  { min: 50, max: 64,  label: 'Moderate — Room for Improvement',       color: 'amber',   priority: 3 },
  { min: 35, max: 49,  label: 'Low Recovery — Action Recommended',     color: 'orange',  priority: 4 },
  { min: 0,  max: 34,  label: 'Critical — Immediate Attention Needed', color: 'red',     priority: 5 }
];

// ── Dimension Score Level Labels ─────────────────────────────────────────────
export const DIMENSION_LEVELS = [
  { min: 80, label: 'Strong',   color: 'emerald' },
  { min: 65, label: 'Good',     color: 'teal'    },
  { min: 50, label: 'Moderate', color: 'amber'   },
  { min: 35, label: 'Low',      color: 'orange'  },
  { min: 0,  label: 'Critical', color: 'red'     }
];

// ── Sleep Duration Reference (hours) ────────────────────────────────────────
export const SLEEP_DURATION_REF = {
  optimal_min: 7,
  optimal_max: 9,
  acceptable_min: 6,
  acceptable_max: 10,
  penalty_per_hour_short: 12,
  penalty_per_hour_long: 8
};

// ── Sleep Efficiency Reference (%) ──────────────────────────────────────────
export const SLEEP_EFFICIENCY_REF = {
  excellent: 90,
  good: 85,
  moderate: 75,
  low: 65
};

// ── Circadian Irregularity Penalty Points ───────────────────────────────────
export const CIRCADIAN_PENALTIES = {
  high_screen_time: 10,
  very_high_screen_time: 18,
  caffeine_afternoon: 8,
  late_bedtime: 10,
  shift_work: 15,
  irregular_schedule: 12
};

// ── Concern Dimension Labels ─────────────────────────────────────────────────
export const CONCERN_DIMENSION_MAP = {
  sleepQuality:            'Poor sleep quality',
  sleepDurationEfficiency: 'Inadequate sleep duration or efficiency',
  circadianRegularity:     'Irregular sleep-wake rhythm',
  daytimeAlertness:        'Reduced daytime alertness and functioning',
  fatigueRecoveryAdequacy: 'Insufficient energy recovery',
  stressRecoveryBalance:   'Stress-recovery imbalance'
};

// ── Safety Threshold: if daytimeAlertness below this, show professional suggestion
export const SAFETY_ALERTNESS_THRESHOLD = 35;

// ── PSS-10 Raw Score Stress Thresholds (out of 40) ──────────────────────────
export const PSS_THRESHOLDS = {
  low: 13,
  moderate: 26,
  high: 40
};

// ── WHO-5 Raw Score Thresholds (out of 25) ──────────────────────────────────
export const WHO5_THRESHOLDS = {
  poor: 13,
  moderate: 18,
  good: 25
};
