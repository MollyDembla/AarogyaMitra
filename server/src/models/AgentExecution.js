import mongoose from 'mongoose';

const AgentExecutionSchema = new mongoose.Schema({
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
  agentName: {
    type: String,
    required: true
  },
  nodeName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'failed', 'awaiting_user'],
    default: 'started'
  },
  triggeredBy: {
    type: String,
    default: 'orchestrator'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  inputSummary: {
    type: mongoose.Schema.Types.Mixed
  },
  outputSummary: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const AgentExecution = mongoose.model('AgentExecution', AgentExecutionSchema);
export default AgentExecution;
