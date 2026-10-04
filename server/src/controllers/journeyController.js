import AgentJourney from '../models/AgentJourney.js';
import WellnessResult from '../models/WellnessResult.js';
import { analyzeDomainPriorities } from '../rules/routingRules.js';
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

    let journey = null;
    if (journeyId) {
      journey = await AgentJourney.findOne({ _id: journeyId, user: req.user.id });
    }
    if (!journey) {
      journey = await AgentJourney.findOne({ user: req.user.id, status: 'in_progress' }).sort({ createdAt: -1 });
    }

    if (!journey) {
      // Auto-create active journey if missing
      journey = await AgentJourney.create({
        user: req.user.id,
        currentAgent: 'Psychological Support Agent',
        status: 'in_progress',
        completedAgents: ['wellness_assessment']
      });
    }

    if (status) {
      journey.status = status;
    }

    // Canonical normalization helper to eliminate duplicate agent name variations
    const canonical = (raw) => {
      if (!raw) return null;
      const s = String(raw).toLowerCase();
      if (s.includes('assessment')) return 'wellness_assessment';
      if (s.includes('professional') || s.includes('care')) return 'Professional Support Pathway';
      if (s.includes('psycho')) return 'Psychological Support Agent';
      if (s.includes('physic')) return 'Physical Activity Agent';
      if (s.includes('recovery')) return 'Recovery and Wellness Agent';
      return raw;
    };

    const normalizedCompleted = canonical(completedAgent);
    if (normalizedCompleted) {
      // Check if already present under any variant
      const alreadyPresent = journey.completedAgents.some(c => canonical(c) === normalizedCompleted);
      if (!alreadyPresent) {
        journey.completedAgents.push(normalizedCompleted);
      }
    }

    // Reassess state & recommend the next optimal UNCOMPLETED agent based on domain scores
    try {
      const latestResult = await WellnessResult.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (latestResult && latestResult.domainScores) {
        const priorities = analyzeDomainPriorities(latestResult.domainScores);
        const completedList = (journey.completedAgents || []).map(c => canonical(c));

        // Find next uncompleted agent in domain score priority sequence
        const nextPriority = priorities.find(p => {
          const targetCanonical = canonical(p.targetAgent);
          return !completedList.includes(targetCanonical);
        });

        if (nextPriority) {
          journey.currentAgent = nextPriority.targetAgent;
          journey.recommendationReason = `Re-assessment completed after ${normalizedCompleted ? normalizedCompleted.replace(' Agent', '') : 'agent action'}: ${nextPriority.name} (Score: ${nextPriority.score}/100) identified as your next highest priority focus area.`;
        } else {
          journey.currentAgent = 'Journey Complete';
          journey.recommendationReason = 'All recommended agent modules completed successfully! Your holistic wellness plan is fully active.';
        }
      }
    } catch (reassessErr) {
      console.warn('Reassessment routing warning:', reassessErr);
    }

    await journey.save();
    return apiResponse.success(res, 'Journey updated and reassessed successfully', journey);
  } catch (error) {
    next(error);
  }
};
