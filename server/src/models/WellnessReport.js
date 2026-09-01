import mongoose from 'mongoose';

const WellnessReportSchema = new mongoose.Schema({
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
  overallWellnessSummary: { type: String, default: '' },
  psychometricAssessmentSummary: { type: String, default: '' },
  lifestyleInsights: { type: String, default: '' },
  personalHealthContext: { type: String, default: '' },
  strengths: { type: String, default: '' },
  areasRequiringAttention: { type: String, default: '' },
  keyContributingFactors: { type: String, default: '' },
  recommendedNextStep: { type: String, default: '' },
  disclaimer: {
    type: String,
    default: "Disclaimer: AarogyaMitra is a wellness assessment and guidance system. It does NOT claim to diagnose mental disorders or replace licensed doctors, psychologists, psychiatrists, or therapists."
  }
}, {
  timestamps: true
});

export const WellnessReport = mongoose.model('WellnessReport', WellnessReportSchema);
export default WellnessReport;
