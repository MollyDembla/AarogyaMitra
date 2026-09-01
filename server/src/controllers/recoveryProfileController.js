import RecoveryProfile from '../models/RecoveryProfile.js';
import { apiResponse } from '../utils/apiResponse.js';

// ── GET /api/recovery/profile/latest ────────────────────────────────────────
export const getLatestRecoveryProfile = async (req, res, next) => {
  try {
    const profile = await RecoveryProfile.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });

    if (!profile) {
      return apiResponse.success(res, 'No recovery profile found yet.', null);
    }

    return apiResponse.success(res, 'Latest recovery profile retrieved', profile);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/recovery/feedback ─────────────────────────────────────────────
export const submitRecoveryFeedback = async (req, res, next) => {
  try {
    const { profileId, recommendationCategory, followed, difficulty, improvement, notes } = req.body;

    const profile = await RecoveryProfile.findOne({ _id: profileId, user: req.user.id });
    if (!profile) {
      return apiResponse.error(res, 'Recovery profile not found', null, 404);
    }

    profile.feedbackHistory.push({
      date: new Date(),
      recommendationCategory,
      followed,
      difficulty,
      improvement,
      notes
    });

    await profile.save();

    return apiResponse.success(res, 'Feedback recorded successfully', {
      feedbackCount: profile.feedbackHistory.length,
      latestFeedback: profile.feedbackHistory[profile.feedbackHistory.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/recovery/history ────────────────────────────────────────────────
export const getRecoveryHistory = async (req, res, next) => {
  try {
    const profiles = await RecoveryProfile.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('recoveryWellnessIndex overallRecoveryLevel dimensionScores primaryConcern createdAt feedbackHistory');

    return apiResponse.success(res, 'Recovery history retrieved', profiles);
  } catch (error) {
    next(error);
  }
};
