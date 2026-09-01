import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'agent'], required: true },
  text: { type: String, required: true },
  riskLevel: { type: String, default: 'normal' },
  timestamp: { type: Date, default: Date.now }
});

const moodEntrySchema = new mongoose.Schema({
  moodScore: { type: Number, min: 1, max: 10 },
  stressScore: { type: Number, min: 1, max: 10 },
  energyScore: { type: Number, min: 1, max: 10 },
  emotionalTags: [String],
  reflection: String,
  date: { type: Date, default: Date.now }
});

const journalEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['free', 'guided'], default: 'free' },
  content: String,
  prompts: [String],
  date: { type: Date, default: Date.now }
});

const goalSchema = new mongoose.Schema({
  title: String,
  actions: [String],
  timeframe: String,
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const psychSupportSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  journey: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentJourney' },
  sessionNumber: { type: Number, default: 1 },
  messages: [messageSchema],
  moodEntries: [moodEntrySchema],
  journalEntries: [journalEntrySchema],
  goals: [goalSchema],
  currentEmotionalState: String,
  identifiedConcerns: [String],
  copingPlan: [String],
  suggestedActivities: [mongoose.Schema.Types.Mixed],
  riskLevel: { type: String, enum: ['normal', 'moderate_concern', 'high_concern', 'crisis'], default: 'normal' },
  safetyFlag: { type: Boolean, default: false },
  professionalSupportRecommended: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('PsychSupportSession', psychSupportSessionSchema);
