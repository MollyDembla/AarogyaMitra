import mongoose from 'mongoose';

const LifestyleBehavioralInputSchema = new mongoose.Schema({
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
  physicalActivity: {
    daysPerWeek: { type: Number },
    avgDurationMinutes: { type: Number },
    activityType: { type: String }
  },
  sedentaryTime: {
    hoursSittingPerDay: { type: Number }
  },
  dietaryHabits: {
    mealRegularity: { type: String }, // e.g. Regular, Irregular, Skip Meals
    generalDietQuality: { type: String }, // e.g. Poor, Fair, Good, Excellent
    waterIntakeLiters: { type: Number }
  },
  screenTime: {
    hoursPerDay: { type: Number },
    lateNightScreenUsage: { type: Boolean }
  },
  substanceUse: {
    alcoholFrequency: { type: String }, // e.g. Never, Occasional, Regular
    smokingStatus: { type: String }, // e.g. Non-smoker, Former, Active
    otherSubstanceUse: { type: String } // stored minimally/privately
  }
}, {
  timestamps: true
});

export const LifestyleBehavioralInput = mongoose.model('LifestyleBehavioralInput', LifestyleBehavioralInputSchema);
export default LifestyleBehavioralInput;
