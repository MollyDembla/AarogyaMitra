import mongoose from 'mongoose';

const AgentEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true
  },
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
  type: {
    type: String,
    required: true
  },
  sourceAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export const AgentEvent = mongoose.model('AgentEvent', AgentEventSchema);
export default AgentEvent;
