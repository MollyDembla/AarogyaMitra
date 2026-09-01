import { routingRules, analyzeDomainPriorities } from '../../rules/routingRules.js';

/**
 * Deterministic, Rule-Based Reasoning and Decision-Making Agent.
 * Analyzes the complete report, 6 domain scores, and safety flags to determine which domain
 * requires the most attention, recommending the corresponding specialized agent.
 */
export const runReasoningAgent = async (context = {}) => {
  const completed = context.completedAgents || [];

  // Analyze and rank the 6 domain scores from lowest (highest priority need) to highest
  const domainPriorities = analyzeDomainPriorities(context.domainScores || {});
  const lowestDomain = domainPriorities[0];

  // Exclude agents already completed in this journey cycle, except Safety Pathway
  const activeRules = routingRules.filter(rule => {
    if (rule.name === 'Professional Support Pathway') return true;
    return !completed.includes(rule.name);
  });

  let selectedAgent = 'Recovery and Wellness Agent';
  let selectedReason = `Report analysis indicates all domains are relatively balanced. Recovery & Wellness (${domainPriorities.find(d => d.key === 'recoveryWellness')?.score || 70}/100) is assigned for ongoing preventive maintenance.`;
  let priority = 'medium';

  // Evaluate rules sequentially
  for (const rule of activeRules) {
    if (rule.evaluate(context)) {
      selectedAgent = rule.name;
      selectedReason = rule.getReason ? rule.getReason(context) : rule.reason;
      
      if (rule.name === 'Professional Support Pathway') {
        priority = 'high';
      } else {
        priority = 'medium';
      }
      break;
    }
  }

  // Look-ahead next agent determination
  const remainingRules = activeRules.filter(r => r.name !== selectedAgent);
  let nextAgent = 'None';
  for (const r of remainingRules) {
    if (r.evaluate(context)) {
      nextAgent = r.name;
      break;
    }
  }

  return {
    primaryAgent: selectedAgent,
    reason: selectedReason,
    priority,
    lowestDomainNeed: lowestDomain,
    domainRankings: domainPriorities,
    nextAgent,
    journeyStatus: 'in_progress'
  };
};
