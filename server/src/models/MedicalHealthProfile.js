import mongoose from 'mongoose';

const MedicalHealthProfileSchema = new mongoose.Schema({
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
  chronicConditions: [{ type: String }],
  currentMedications: [{ type: String }],
  previousDiagnoses: [{ type: String }],
  allergies: [{ type: String }],
  physicalLimitations: [{ type: String }],
  
  // Future physiological/wearable biomarkers
  physiologicalBiomarkers: {
    restingHeartRate: { type: Number }, // bpm
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    sleepHours: { type: Number }
  }
}, {
  timestamps: true
});

export const MedicalHealthProfile = mongoose.model('MedicalHealthProfile', MedicalHealthProfileSchema);
export default MedicalHealthProfile;
