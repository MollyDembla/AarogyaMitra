import mongoose from 'mongoose';

const ProgressRecordSchema = new mongoose.Schema({
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
  overallScore: {
    type: Number,
    required: true
  },
  wellnessCategory: {
    type: String,
    required: true
  },
  domainScores: {
    type: mongoose.Schema.Types.Mixed
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const ProgressRecord = mongoose.model('ProgressRecord', ProgressRecordSchema);
export default ProgressRecord;
