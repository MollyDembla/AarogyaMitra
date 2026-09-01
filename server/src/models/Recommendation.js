import mongoose from 'mongoose';

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellnessAssessment',
    required: true
  },
  agentName: {
    type: String
  },
  category: {
    type: String // e.g. Exercise, Sleep, Mindfulness, Nutrition
  },
  text: {
    type: String,
    required: true
  },
  isActioned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Recommendation = mongoose.model('Recommendation', RecommendationSchema);
export default Recommendation;
