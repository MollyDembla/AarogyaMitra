import AgentJourney from '../models/AgentJourney.js';
import WellnessResult from '../models/WellnessResult.js';
import AgentEvent from '../models/AgentEvent.js';
import AgentExecution from '../models/AgentExecution.js';
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
        currentAgent: 'Recovery and Wellness Agent',
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

        // Audit Trail: Log AGENT_COMPLETED Event
        try {
          await AgentEvent.create({
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sessionId: String(journey._id),
            user: req.user.id,
            type: 'AGENT_COMPLETED',
            sourceAgent: normalizedCompleted,
            payload: { completedAgent: normalizedCompleted, timestamp: new Date() }
          });
          await AgentExecution.create({
            sessionId: String(journey._id),
            user: req.user.id,
            agentName: normalizedCompleted,
            nodeName: `${normalizedCompleted}_node`,
            status: 'completed',
            completedAt: new Date(),
            outputSummary: { message: `Completed ${normalizedCompleted}` }
          });
        } catch (evtErr) {
          console.warn('Failed to record AGENT_COMPLETED event:', evtErr);
        }
      }
    }

    // Reassess state & recommend the next optimal UNCOMPLETED agent based on domain scores
    try {
      // Audit Trail: Log JOURNEY_REASSESSED Event
      try {
        await AgentEvent.create({
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sessionId: String(journey._id),
          user: req.user.id,
          type: 'JOURNEY_REASSESSED',
          sourceAgent: 'langgraph_orchestrator',
          payload: { trigger: 'agent_completion', timestamp: new Date() }
        });
      } catch (evtErr) {}

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
          const prevAgentName = journey.currentAgent || 'wellness_assessment';
          journey.previousAgent = prevAgentName;
          journey.previousNode = `${prevAgentName.replace(/ /g, '_').toLowerCase()}_node`;

          journey.currentAgent = nextPriority.targetAgent;
          journey.currentNode = `${nextPriority.targetAgent.replace(/ /g, '_').toLowerCase()}_node`;
          journey.journeyIteration = (journey.journeyIteration || 1) + 1;

          journey.recommendationReason = `LangGraph reassessed graph state after ${normalizedCompleted ? normalizedCompleted.replace(' Agent', '') : 'agent execution'}: ${nextPriority.name} (Score: ${nextPriority.score}/100) selected as next node because focus is needed in this domain.`;

          // Audit Trail: Log DECISION_MADE and AGENT_STARTED Events
          try {
            await AgentEvent.create({
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              sessionId: String(journey._id),
              user: req.user.id,
              type: 'DECISION_MADE',
              sourceAgent: 'decision_making_agent',
              payload: { 
                previousAgent: prevAgentName,
                selectedAgent: nextPriority.targetAgent, 
                iteration: journey.journeyIteration,
                reason: journey.recommendationReason, 
                timestamp: new Date() 
              }
            });
            await AgentEvent.create({
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              sessionId: String(journey._id),
              user: req.user.id,
              type: 'AGENT_STARTED',
              sourceAgent: nextPriority.targetAgent,
              payload: { agentName: nextPriority.targetAgent, timestamp: new Date() }
            });
          } catch (evtErr) {}

        } else {
          journey.previousAgent = journey.currentAgent;
          journey.previousNode = journey.currentNode;
          journey.currentAgent = 'Journey Complete';
          journey.currentNode = 'wellness_summary_node';
          journey.recommendationReason = 'All recommended agent modules completed successfully! Your holistic wellness plan is fully active.';
          
          try {
            await AgentEvent.create({
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              sessionId: String(journey._id),
              user: req.user.id,
              type: 'JOURNEY_COMPLETED',
              sourceAgent: 'langgraph_orchestrator',
              payload: { reason: journey.recommendationReason, timestamp: new Date() }
            });
          } catch (evtErr) {}
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
