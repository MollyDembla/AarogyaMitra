import mongoose from 'mongoose';

const WellnessSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'awaiting_user', 'completed', 'failed'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  currentAgent: {
    type: String,
    default: 'wellness_assessment'
  },
  journeyStatus: {
    type: String,
    default: 'pending'
  },
  mmwbi: {
    type: Number
  },
  riskLevel: {
    type: String
  },
  graphState: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export const WellnessSession = mongoose.model('WellnessSession', WellnessSessionSchema);
export default WellnessSession;
