import PsychSupportSession from '../models/PsychSupportSession.js';
import WellnessResult from '../models/WellnessResult.js';
import AgentJourney from '../models/AgentJourney.js';
import { runPsychologicalSupportAgent } from '../agents/psychologicalSupport/index.js';
import { apiResponse } from '../utils/apiResponse.js';

/**
 * POST /api/psych/session
 * Send a message to the Psychological Support Agent within a session.
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { userMessage, sessionId } = req.body;
    if (!userMessage?.trim()) {
      return apiResponse.error(res, 'Message is required', null, 400);
    }

    // Load latest wellness context for the agent
    const latestResult = await WellnessResult.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' }).sort({ createdAt: -1 });

    const context = {
      userName: req.user.firstName,
      mmwbi: latestResult?.overallWellBeingScore,
      domainScores: latestResult?.domainScores,
      psychometricScores: latestResult?.psychometricScores,
      primaryConcerns: latestResult?.primaryConcerns,
      strengths: latestResult?.strengths,
      rwi: null // Will be populated from recovery profile if needed
    };

    // Find or create active session
    let session;
    if (sessionId) {
      session = await PsychSupportSession.findOne({ _id: sessionId, user: req.user.id });
    }
    if (!session) {
      const count = await PsychSupportSession.countDocuments({ user: req.user.id });
      session = new PsychSupportSession({
        user: req.user.id,
        journey: journey?._id,
        sessionNumber: count + 1,
        messages: []
      });
    }

    // Add user message
    session.messages.push({ sender: 'user', text: userMessage });

    // Run agent with full conversation history
    const agentOutput = await runPsychologicalSupportAgent(
      userMessage,
      context,
      session.messages.slice(-10) // Last 10 messages for context
    );

    // Add agent reply
    session.messages.push({
      sender: 'agent',
      text: agentOutput.reply,
      riskLevel: agentOutput.riskLevel
    });

    // Update session state
    session.riskLevel = agentOutput.riskLevel;
    session.safetyFlag = agentOutput.safetyFlag || false;
    session.professionalSupportRecommended = agentOutput.showProfessionalSuggestion || false;
    session.suggestedActivities = agentOutput.suggestedActivities;
    session.currentEmotionalState = agentOutput.emotionalState;
    await session.save();

    // Dynamically update AgentJourney based on agent output
    if (journey) {
      if (agentOutput.safetyFlag || agentOutput.riskLevel === 'crisis' || agentOutput.riskLevel === 'high') {
        journey.currentAgent = 'Professional Support Pathway';
        journey.recommendationReason = 'Safety evaluation detected elevated psychological distress during conversation. Immediate professional care navigation is prioritized.';
        if (!journey.completedAgents.includes('Psychological Support Agent')) {
          journey.completedAgents.push('Psychological Support Agent');
        }
      } else {
        if (!journey.completedAgents.includes('Psychological Support Agent')) {
          journey.completedAgents.push('Psychological Support Agent');
        }
        // Determine dynamic next step: Physical Activity if not completed, or Wellness Plan
        if (!journey.completedAgents.includes('Physical Activity Agent')) {
          journey.currentAgent = 'Physical Activity Agent';
          journey.recommendationReason = 'Psychological support session completed safely. Physical Activity posture alignment is recommended next.';
        } else if (!journey.completedAgents.includes('Recovery and Wellness Agent')) {
          journey.currentAgent = 'Recovery and Wellness Agent';
          journey.recommendationReason = 'Psychological support session completed safely. Recovery routine planning is recommended next.';
        } else {
          journey.currentAgent = 'Wellness Plan Generator';
          journey.status = 'completed';
          journey.recommendationReason = 'All agent interactions completed safely. Your personalized wellness plan is synthesized.';
        }
      }
      await journey.save();
    }

    return apiResponse.success(res, 'Message processed', {
      sessionId: session._id,
      agentOutput,
      journey,
      sessionNumber: session.sessionNumber
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/psych/session/latest
 * Get the latest active session (messages, mood, journal, goals).
 */
export const getLatestSession = async (req, res, next) => {
  try {
    const session = await PsychSupportSession.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!session) {
      return apiResponse.success(res, 'No sessions found', { session: null });
    }
    return apiResponse.success(res, 'Session retrieved', { session });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/psych/mood
 * Log a mood entry.
 */
export const logMood = async (req, res, next) => {
  try {
    const { moodScore, stressScore, energyScore, emotionalTags, reflection } = req.body;

    let session = await PsychSupportSession.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!session) {
      session = new PsychSupportSession({ user: req.user.id, sessionNumber: 1 });
    }

    session.moodEntries.push({ moodScore, stressScore, energyScore, emotionalTags, reflection });
    await session.save();

    return apiResponse.success(res, 'Mood logged', { entry: session.moodEntries[session.moodEntries.length - 1] });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/psych/mood/history
 * Get last 30 mood entries for trend display.
 */
export const getMoodHistory = async (req, res, next) => {
  try {
    const sessions = await PsychSupportSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
    const moodEntries = sessions.flatMap(s => s.moodEntries)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    return apiResponse.success(res, 'Mood history retrieved', { moodEntries });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/psych/journal
 * Submit a journal entry.
 */
export const addJournalEntry = async (req, res, next) => {
  try {
    const { content, type, prompts } = req.body;

    let session = await PsychSupportSession.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!session) {
      session = new PsychSupportSession({ user: req.user.id, sessionNumber: 1 });
    }

    session.journalEntries.push({ content, type: type || 'free', prompts });
    await session.save();

    return apiResponse.success(res, 'Journal entry saved', {
      entry: session.journalEntries[session.journalEntries.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/psych/goal
 * Create or update a goal.
 */
export const addGoal = async (req, res, next) => {
  try {
    const { title, actions, timeframe } = req.body;

    let session = await PsychSupportSession.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!session) {
      session = new PsychSupportSession({ user: req.user.id, sessionNumber: 1 });
    }

    session.goals.push({ title, actions, timeframe });
    await session.save();

    return apiResponse.success(res, 'Goal created', {
      goal: session.goals[session.goals.length - 1]
    });
  } catch (error) {
    next(error);
  }
};
