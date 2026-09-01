import mongoose from 'mongoose';

const PsychometricAssessmentSchema = new mongoose.Schema({
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
  // WHO-5 Well-Being Index (5 questions, raw sum 0-25, percent 0-100)
  who5: {
    responses: [{ type: Number }], // raw 0-5
    score: { type: Number }        // raw score
  },
  // Perceived Stress Scale (PSS-10, 10 questions, raw sum 0-40)
  pss10: {
    responses: [{ type: Number }], // raw 0-4
    score: { type: Number }        // total score
  },
  // GAD-7 Anxiety Screening (7 questions, raw sum 0-21)
  gad7: {
    responses: [{ type: Number }], // raw 0-3
    score: { type: Number }        // total score
  },
  // PHQ-9 Depression Screening (9 questions, raw sum 0-27)
  phq9: {
    responses: [{ type: Number }], // raw 0-3
    score: { type: Number }        // total score
  }
}, {
  timestamps: true
});

export const PsychometricAssessment = mongoose.model('PsychometricAssessment', PsychometricAssessmentSchema);
export default PsychometricAssessment;
