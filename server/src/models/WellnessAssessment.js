import mongoose from 'mongoose';

const WellnessAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentNumber: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'completed'],
    default: 'draft'
  },
  currentStep: {
    type: Number,
    default: 1
  },
  psychometricAssessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PsychometricAssessment'
  },
  lifestyleBehavioralInput: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LifestyleBehavioralInput'
  },
  medicalHealthProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalHealthProfile'
  },
  submittedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export const WellnessAssessment = mongoose.model('WellnessAssessment', WellnessAssessmentSchema);
export default WellnessAssessment;
