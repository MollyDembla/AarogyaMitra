import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { apiResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import WellnessSession from '../models/WellnessSession.js';
import AgentExecution from '../models/AgentExecution.js';
import AgentEvent from '../models/AgentEvent.js';
import WellnessResult from '../models/WellnessResult.js';
import WellnessAssessment from '../models/WellnessAssessment.js';
import WellnessPlan from '../models/WellnessPlan.js';
import Recommendation from '../models/Recommendation.js';
import PsychSupportSession from '../models/PsychSupportSession.js';
import RecoveryProfile from '../models/RecoveryProfile.js';
import AgentJourney from '../models/AgentJourney.js';

/**
 * @desc Admin Login using single separate email & password
 * @route POST /api/admin/login
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiResponse.error(res, 'Please provide both email and password', null, 400);
    }

    const adminEmail = (env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@aarogyamitra.com').trim().toLowerCase();
    const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@Aarogya2026!';

    const isEmailValid = email.trim().toLowerCase() === adminEmail;
    const isPasswordValid = password === adminPassword;

    if (!isEmailValid || !isPasswordValid) {
      return apiResponse.error(res, 'Invalid admin credentials', null, 401);
    }

    const token = jwt.sign(
      { id: 'admin-root-user', email: adminEmail, role: 'admin' },
      env.JWT_SECRET || 'aarogyamitra_default_jwt_secret_key_12345',
      { expiresIn: '7d' }
    );

    return apiResponse.success(res, 'Admin authentication successful', {
      token,
      admin: {
        id: 'admin-root-user',
        email: adminEmail,
        role: 'admin',
        name: 'System Administrator'
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current admin token session details
 * @route GET /api/admin/me
 */
export const getAdminMe = async (req, res, next) => {
  try {
    return apiResponse.success(res, 'Admin token verified', {
      admin: req.admin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get high-level platform statistics and metrics for admin overview
 * @route GET /api/admin/stats
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await WellnessSession.countDocuments();
    const activeSessions = await WellnessSession.countDocuments({ status: { $in: ['active', 'paused'] } });
    const completedSessions = await WellnessSession.countDocuments({ status: 'completed' });
    const totalExecutions = await AgentExecution.countDocuments();

    // High risk & crisis flags
    const highRiskSessions = await WellnessSession.countDocuments({ 'sharedState.highRiskDetected': true });
    const crisisEventsCount = await AgentEvent.countDocuments({ eventType: 'CRISIS_DETECTED' });

    // Agent breakdown
    const agentBreakdownRaw = await AgentExecution.aggregate([
      { $group: { _id: '$agentName', count: { $sum: 1 } } }
    ]);

    const agentNodeBreakdown = {};
    agentBreakdownRaw.forEach(item => {
      if (item._id) agentNodeBreakdown[item._id] = item.count;
    });

    // Recent 5 executions stream
    const recentExecutions = await AgentExecution.find()
      .sort({ timestamp: -1 })
      .limit(8)
      .populate('user', 'email firstName lastName');

    return apiResponse.success(res, 'Platform analytics retrieved successfully', {
      stats: {
        totalUsers,
        totalSessions,
        activeSessions,
        completedSessions,
        totalExecutions,
        highRiskSessions,
        crisisEventsCount,
        agentNodeBreakdown
      },
      recentExecutions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get list of all users with profile data, latest wellness risk & scores
 * @route GET /api/admin/users
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    const usersWithDetails = await Promise.all(
      users.map(async (u) => {
        const profile = await UserProfile.findOne({ user: u._id }).lean();
        const latestResult = await WellnessResult.findOne({ user: u._id }).sort({ createdAt: -1 }).lean();
        const sessionCount = await WellnessSession.countDocuments({ user: u._id });
        const lastSession = await WellnessSession.findOne({ user: u._id }).sort({ updatedAt: -1 }).lean();
        const executionsCount = await AgentExecution.countDocuments({ user: u._id });
        const journey = await AgentJourney.findOne({ user: u._id }).sort({ updatedAt: -1 }).lean();

        return {
          id: u._id,
          _id: u._id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          createdAt: u.createdAt,
          profile: profile || null,
          latestResult: latestResult ? {
            mmwbi: latestResult.mmwbi,
            riskLevel: latestResult.riskLevel,
            userFacingRiskLabel: latestResult.userFacingRiskLabel,
            calculatedAt: latestResult.createdAt
          } : null,
          sessionCount,
          executionsCount,
          journey: journey ? {
            currentAgent: journey.currentAgent,
            previousAgent: journey.previousAgent,
            currentNode: journey.currentNode,
            previousNode: journey.previousNode,
            journeyIteration: journey.journeyIteration,
            recommendationReason: journey.recommendationReason,
            status: journey.status
          } : null,
          lastActive: lastSession ? lastSession.updatedAt : u.createdAt
        };
      })
    );

    return apiResponse.success(res, 'User directory retrieved successfully', {
      users: usersWithDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get complete details, agent history, task progress, and state of a single user
 * @route GET /api/admin/users/:userId/details
 */
export const getAdminUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return apiResponse.error(res, 'User not found', null, 404);
    }

    const profile = await UserProfile.findOne({ user: userId }).lean();
    const assessments = await WellnessAssessment.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const results = await WellnessResult.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const sessions = await WellnessSession.find({ user: userId }).sort({ updatedAt: -1 }).lean();
    const executions = await AgentExecution.find({ user: userId }).sort({ timestamp: -1 }).lean();
    const events = await AgentEvent.find({ user: userId }).sort({ timestamp: -1 }).lean();
    const wellnessPlan = await WellnessPlan.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    const recommendations = await Recommendation.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const psychSessions = await PsychSupportSession.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const recoveryProfile = await RecoveryProfile.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
    const journey = await AgentJourney.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();

    return apiResponse.success(res, 'User detailed history retrieved successfully', {
      user,
      profile,
      assessments,
      results,
      sessions,
      executions,
      events,
      wellnessPlan,
      recommendations,
      psychSessions,
      recoveryProfile,
      journey
    });
  } catch (error) {
    next(error);
  }
};

import McpLog from '../models/McpLog.js';
import { seedMcpLogsIfEmpty } from '../utils/mcpLogger.js';

/**
 * @desc Get global system-wide agent logs and executions across all users
 * @route GET /api/admin/logs
 */
export const getAdminLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const skip = (page - 1) * limit;

    const { agentName, status, search } = req.query;

    const filter = {};
    if (agentName) filter.agentName = agentName;
    if (status) filter.status = status;

    const logs = await AgentExecution.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'email firstName lastName')
      .lean();

    const total = await AgentExecution.countDocuments(filter);

    return apiResponse.success(res, 'Agent execution logs retrieved', {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get MCP (Model Context Protocol) tool activity logs and performance metrics
 * @route GET /api/admin/mcp-logs
 */
export const getAdminMcpLogs = async (req, res, next) => {
  try {
    await seedMcpLogsIfEmpty();

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const skip = (page - 1) * limit;

    const { toolName, agentName, status, userId } = req.query;

    const filter = {};
    if (toolName) filter.toolName = toolName;
    if (agentName) filter.agentName = agentName;
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const logs = await McpLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'email firstName lastName')
      .lean();

    const total = await McpLog.countDocuments(filter);
    const successCount = await McpLog.countDocuments({ ...filter, status: 'success' });
    const failedCount = await McpLog.countDocuments({ ...filter, status: 'failed' });

    const avgDurationAgg = await McpLog.aggregate([
      { $match: filter },
      { $group: { _id: null, avgMs: { $avg: '$durationMs' } } }
    ]);
    const avgDurationMs = Math.round(avgDurationAgg[0]?.avgMs || 110);

    const toolBreakdownRaw = await McpLog.aggregate([
      { $group: { _id: '$toolName', count: { $sum: 1 } } }
    ]);
    const toolBreakdown = {};
    toolBreakdownRaw.forEach(t => { if (t._id) toolBreakdown[t._id] = t.count; });

    return apiResponse.success(res, 'MCP Tool Activity Logs retrieved successfully', {
      logs,
      metrics: {
        totalCalls: total,
        successCount,
        failedCount,
        successRate: total > 0 ? Math.round((successCount / total) * 100) : 100,
        avgDurationMs,
        toolBreakdown
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
