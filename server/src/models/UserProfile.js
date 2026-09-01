import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
  height: {
    type: Number, // in cm
    required: false
  },
  weight: {
    type: Number, // in kg
    required: false
  },
  bmi: {
    type: Number,
    required: false
  },
  education: {
    type: String,
    required: false
  },
  occupation: {
    type: String,
    required: false
  },
  workPattern: {
    type: String,
    enum: ['Sedentary', 'Physically active', 'Hybrid', 'Shift-based', 'Student', 'Other'],
    required: false
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
UserProfileSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }
  next();
});

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
export default UserProfile;
