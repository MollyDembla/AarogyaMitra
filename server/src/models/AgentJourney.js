import mongoose from 'mongoose';

const AgentJourneySchema = new mongoose.Schema({
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
  currentAgent: {
    type: String,
    enum: ['Physical Activity Agent', 'Psychological Support Agent', 'Professional Support Pathway', 'Recovery and Wellness Agent'],
    required: true
  },
  recommendationReason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  completedAgents: [{ type: String }],
  steps: [{
    agentName: { type: String },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentResult' },
    visitedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export const AgentJourney = mongoose.model('AgentJourney', AgentJourneySchema);
export default AgentJourney;
