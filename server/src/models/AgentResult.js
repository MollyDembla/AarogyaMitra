import mongoose from 'mongoose';

const AgentResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentJourney',
    required: true
  },
  agentName: {
    type: String,
    enum: ['Physical Activity Agent', 'Psychological Support Agent', 'Professional Support Pathway', 'Recovery and Wellness Agent'],
    required: true
  },
  // Flexible input context details
  inputContext: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Flexible output evaluation/recommendation details
  outputData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const AgentResult = mongoose.model('AgentResult', AgentResultSchema);
export default AgentResult;
