import AgentJourney from '../models/AgentJourney.js';
import { apiResponse } from '../utils/apiResponse.js';

export const getCurrentJourney = async (req, res, next) => {
  try {
    const journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'steps.resultId',
        model: 'AgentResult'
      });
      
    if (!journey) {
      return apiResponse.success(res, 'No active journey found.', null);
    }
    return apiResponse.success(res, 'Active journey retrieved', journey);
  } catch (error) {
    next(error);
  }
};

export const updateJourney = async (req, res, next) => {
  try {
    const { journeyId, status, completedAgent } = req.body;

    const journey = await AgentJourney.findOne({ _id: journeyId, user: req.user.id });
    if (!journey) {
      return apiResponse.error(res, 'Journey not found', null, 404);
    }

    if (status) {
      journey.status = status;
    }

    if (completedAgent && !journey.completedAgents.includes(completedAgent)) {
      journey.completedAgents.push(completedAgent);
    }

    await journey.save();
    return apiResponse.success(res, 'Journey updated successfully', journey);
  } catch (error) {
    next(error);
  }
};
