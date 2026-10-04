import mongoose from 'mongoose';

const WellnessPlanSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mmwbi: {
    type: Number
  },
  domainScores: {
    type: mongoose.Schema.Types.Mixed
  },
  recoveryIndex: {
    type: Number
  },
  physicalActivityScore: {
    type: Number
  },
  psychologicalResult: {
    type: mongoose.Schema.Types.Mixed
  },
  detectedFlags: [{ type: String }],
  recommendations: [{ type: String }],
  professionalCareGuidance: {
    type: mongoose.Schema.Types.Mixed
  },
  summary: {
    type: mongoose.Schema.Types.Mixed
  },
  planSections: [{ type: mongoose.Schema.Types.Mixed }],
  nextSteps: [{ type: String }],
  agentJourneyNarrative: [{ type: mongoose.Schema.Types.Mixed }]
}, {
  timestamps: true
});

export const WellnessPlan = mongoose.model('WellnessPlan', WellnessPlanSchema);
export default WellnessPlan;
