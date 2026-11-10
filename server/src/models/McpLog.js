import mongoose from 'mongoose';

const mcpLogSchema = new mongoose.Schema({
  toolName: {
    type: String,
    required: true,
    index: true
  },
  agentName: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
    index: true
  },
  durationMs: {
    type: Number,
    default: 120
  },
  inputPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  outputPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  errorDetails: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('McpLog', mcpLogSchema);
