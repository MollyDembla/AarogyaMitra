import mongoose from 'mongoose';

const WellnessResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellnessAssessment',
    required: false,
    default: null
  },
  overallWellBeingScore: {
    type: Number,
    required: true
  },
  wellnessCategory: {
    type: String,
    required: true
  },
  userFacingRiskLabel: {
    type: String
  },
  domainScores: {
    physicalHealth: { type: Number, default: 0 },
    recoveryWellness: { type: Number, default: 0 },
    psychologicalWellbeing: { type: Number, default: 0 },
    socialWellbeing: { type: Number, default: 0 },
    lifestyleBalance: { type: Number, default: 0 },
    stressResilience: { type: Number, default: 0 },

    // Fallback/legacy compatibility keys
    psychological: { type: Number, default: 0 },
    lifestyle: { type: Number, default: 0 },
    physicalActivity: { type: Number, default: 0 },
    medicalContext: { type: Number, default: 0 }
  },
  mmwbiBreakdown: {
    type: mongoose.Schema.Types.Mixed
  },
  psychometricScores: {
    type: mongoose.Schema.Types.Mixed
  },
  primaryConcerns: [{ type: String }],
  strengths: [{ type: String }],
  attentionFlags: [{ type: String }],
  safetyFlags: [{ type: mongoose.Schema.Types.Mixed }],
  explainabilityFactors: {
    type: mongoose.Schema.Types.Mixed
  },
  explanations: [{ type: String }],
  dataCompleteness: {
    type: Number,
    default: 100
  },
  rawFeaturePayload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export const WellnessResult = mongoose.model('WellnessResult', WellnessResultSchema);
export default WellnessResult;
