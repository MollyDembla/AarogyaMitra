/**
 * LangGraph Node: Reasoning Router
 *
 * This is the BRAIN of the orchestrator. It inspects the current
 * graph state after every agent completes and determines dynamically
 * which agent should execute next.
 *
 * The route is NOT fixed. It is computed from the live graph state.
 *
 * Returns: one of 'recovery', 'physical', 'psychological', 'care',
 *          'reassessment', 'wellness_plan', 'end'
 */
import { routingRules, analyzeDomainPriorities } from '../../rules/routingRules.js';
import { logger } from '../../utils/logger.js';

const NODE_MAP = {
  'Recovery and Wellness Agent': 'recovery',
  'Physical Activity Agent': 'physical',
  'Psychological Support Agent': 'psychological',
  'Professional Support Pathway': 'care'
};

/**
 * Determine the next graph node based on current state.
 * This is the conditional edge function used by LangGraph.
 *
 * @param {Object} state
 * @returns {string} next node key
 */
export function routeFromState(state) {
  const tag = '[LANGGRAPH][Router]';

  // SAFETY OVERRIDE — always highest priority
  if (state.crisisDetected || state.highRiskDetected) {
    logger.warn(`${tag} Safety override → professional_care (crisis=${state.crisisDetected} highRisk=${state.highRiskDetected})`);
    return 'care';
  }

  // Hard limit on loops
  if (state.iterationCount >= state.maxIterations) {
    logger.info(`${tag} Max iterations (${state.maxIterations}) reached → wellness_plan`);
    return 'wellness_plan';
  }

  // If we're awaiting user action, pause here
  if (state.requiresUserAction) {
    logger.info(`${tag} Awaiting user action: ${state.userActionType}`);
    return 'awaiting_user';
  }

  const completed = state.completedAgents || [];
  const domainScores = state.domainScores || {};

  // Build routing context from full graph state
  const routingCtx = {
    mmwbi: state.mmwbi,
    riskLevel: state.riskLevel,
    domainScores,
    psychometricScores: state.psychometricScores,
    attentionFlags: state.attentionFlags || [],
    safetyFlags: state.safetyFlags || [],
    primaryConcerns: state.primaryConcerns || [],
    rawFeaturePayload: state.rawFeaturePayload || {},
    completedAgents: completed
  };

  // Use the existing deterministic rule engine
  const activeRules = routingRules.filter(rule => {
    if (rule.name === 'Professional Support Pathway') return true;
    return !completed.includes(rule.name);
  });

  let nextAgentName = null;
  let reason = '';

  for (const rule of activeRules) {
    if (rule.evaluate(routingCtx)) {
      nextAgentName = rule.name;
      reason = rule.getReason ? rule.getReason(routingCtx) : rule.reason;
      break;
    }
  }

  if (!nextAgentName) {
    // All required agents complete — go to reassessment if it hasn't been done yet
    if (!completed.includes('__reassessment__')) {
      logger.info(`${tag} All agents done → reassessment`);
      return 'reassessment';
    }
    // Reassessment done → wellness plan
    logger.info(`${tag} Post-reassessment → wellness_plan`);
    return 'wellness_plan';
  }

  // Check if psychological support is needed and not yet done
  if (nextAgentName === 'Psychological Support Agent' &&
      !completed.includes('Psychological Support Agent')) {
    logger.info(`${tag} Decision: psychological (reason: ${reason.slice(0, 80)}...)`);
    return 'psychological';
  }

  const nodeKey = NODE_MAP[nextAgentName] || 'recovery';
  logger.info(`${tag} Decision: ${nodeKey} — ${nextAgentName} (reason: ${reason.slice(0, 80)}...)`);

  return nodeKey;
}

/**
 * The router node itself — updates state with routing decision metadata.
 * LangGraph will ALSO call routeFromState as the conditional edge function.
 */
export async function reasoningRouterNode(state) {
  const tag = '[LANGGRAPH][Node: reasoning_router]';
  logger.info(`${tag} Analyzing state — iteration=${state.iterationCount} completed=${JSON.stringify(state.completedAgents)}`);

  // Safety check
  if (state.crisisDetected || state.highRiskDetected) {
    logger.warn(`${tag} HIGH_RISK_DETECTED — routing to Professional Care`);
    return {
      nextAction: 'care',
      routerDecision: {
        nextAgent: 'Professional Support Pathway',
        reason: 'Safety flags or high-risk indicators detected. Immediate professional care navigation activated.',
        priority: 'critical'
      },
      triggeredEvents: [...(state.triggeredEvents || []), 'HIGH_RISK_ROUTED_TO_CARE'],
      iterationCount: (state.iterationCount || 0) + 1
    };
  }

  const domainScores = state.domainScores || {};
  const completed = state.completedAgents || [];
  const domainPriorities = analyzeDomainPriorities(domainScores);

  logger.info(`${tag} Domain priorities: ${domainPriorities.map(d => `${d.key}=${d.score}`).join(', ')}`);

  const routingCtx = {
    mmwbi: state.mmwbi,
    riskLevel: state.riskLevel,
    domainScores,
    psychometricScores: state.psychometricScores,
    attentionFlags: state.attentionFlags || [],
    safetyFlags: state.safetyFlags || [],
    primaryConcerns: state.primaryConcerns || [],
    rawFeaturePayload: state.rawFeaturePayload || {},
    completedAgents: completed
  };

  const activeRules = routingRules.filter(rule => {
    if (rule.name === 'Professional Support Pathway') return true;
    return !completed.includes(rule.name);
  });

  let primaryAgent = null;
  let reason = 'All agent requirements satisfied.';
  let priority = 'low';

  for (const rule of activeRules) {
    if (rule.evaluate(routingCtx)) {
      primaryAgent = rule.name;
      reason = rule.getReason ? rule.getReason(routingCtx) : rule.reason;
      priority = rule.name === 'Professional Support Pathway' ? 'critical' : 'medium';
      break;
    }
  }

  // Look-ahead: next agent after current
  let nextAgent = null;
  if (primaryAgent) {
    const remaining = activeRules.filter(r => r.name !== primaryAgent);
    for (const r of remaining) {
      if (r.evaluate(routingCtx)) { nextAgent = r.name; break; }
    }
  }

  const decision = { nextAgent: primaryAgent, nextAfter: nextAgent, reason, priority };
  logger.info(`${tag} Decision: ${JSON.stringify(decision)}`);

  return {
    nextAction: primaryAgent ? (NODE_MAP[primaryAgent] || 'recovery') : 'wellness_plan',
    routerDecision: decision,
    activeAgent: 'reasoning_router',
    iterationCount: (state.iterationCount || 0) + 1
  };
}
