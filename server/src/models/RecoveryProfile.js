import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  recommendationCategory: { type: String },
  followed: { type: Boolean },
  difficulty: { type: Number, min: 1, max: 5 },  // 1=very easy, 5=very hard
  improvement: { type: Number, min: 1, max: 5 },  // 1=much worse, 5=much better
  notes: { type: String, default: '' }
}, { _id: false });

const RecoveryProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentJourney',
    required: false,
    default: null
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellnessAssessment',
    required: false,
    default: null
  },

  // ── Core RWI Output ───────────────────────────────────────────────────────
  recoveryWellnessIndex: { type: Number, required: true },
  overallRecoveryLevel: { type: String, required: true },
  rwiColor: { type: String, default: 'amber' },

  // ── 6 Dimension Scores ────────────────────────────────────────────────────
  dimensionScores: {
    sleepQuality:            { type: Number, default: 0 },
    sleepDurationEfficiency: { type: Number, default: 0 },
    circadianRegularity:     { type: Number, default: 0 },
    daytimeAlertness:        { type: Number, default: 0 },
    fatigueRecoveryAdequacy: { type: Number, default: 0 },
    stressRecoveryBalance:   { type: Number, default: 0 }
  },

  // ── Profile Analysis ──────────────────────────────────────────────────────
  primaryConcern: { type: String, default: '' },
  secondaryConcerns: [{ type: String }],
  contributingFactors: [{ type: String }],
  protectiveFactors: [{ type: String }],
  detectedPatterns: [{ type: mongoose.Schema.Types.Mixed }],
  recoverySummary: { type: String, default: '' },
  alertnessSafetyFlag: { type: Boolean, default: false },
  exceptionalConditions: { type: String, default: '' },
  routinePlan: {
    adaptedForConditions: { type: String, default: '' },
    majorChanges: [{ type: mongoose.Schema.Types.Mixed }],
    dailySchedule: [{ type: mongoose.Schema.Types.Mixed }],
    executionGuidance: { type: String, default: '' }
  },

  // ── Personalized Recommendations ─────────────────────────────────────────
  personalizedRecommendations: {
    sleepHygiene: [{ type: mongoose.Schema.Types.Mixed }],
    recoveryGuidance: [{ type: mongoose.Schema.Types.Mixed }],
    stressManagement: [{ type: mongoose.Schema.Types.Mixed }],
    ayushWellnessGuidance: [{ type: mongoose.Schema.Types.Mixed }]
  },

  followUpQuestions: [{ type: String }],
  nextAction: { type: String, default: '' },

  // ── Feedback History ──────────────────────────────────────────────────────
  feedbackHistory: [FeedbackSchema]

}, { timestamps: true });

export const RecoveryProfile = mongoose.model('RecoveryProfile', RecoveryProfileSchema);
export default RecoveryProfile;
