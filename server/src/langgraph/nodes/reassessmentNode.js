/**
 * LangGraph Node: Reassessment
 *
 * This is the LOOP node. After one or more agents complete, the graph
 * routes here before going back to the router. It evaluates whether:
 *
 * 1. New flags have been detected (e.g., stress still elevated)
 * 2. Safety concerns need re-checking
 * 3. Additional agents should be triggered
 * 4. The journey is complete
 *
 * This enables the OBSERVE → REASON → ACT loop.
 */
import { analyzeDomainPriorities } from '../../rules/routingRules.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function reassessmentNode(state) {
  const tag = '[LANGGRAPH][Node: reassessment]';
  const count = (state.reassessmentCount || 0) + 1;
  logger.info(`${tag} Reassessment #${count} — completedAgents=${JSON.stringify(state.completedAgents)}`);

  // ── Analyze current state ─────────────────────────────────────────────
  const completed = state.completedAgents || [];
  const domainScores = state.domainScores || {};
  const flags = state.detectedFlags || [];

  // Check if safety still needs care navigation
  const safetyStillActive = (state.highRiskDetected || state.crisisDetected) &&
    !completed.includes('Professional Support Pathway');

  if (safetyStillActive) {
    logger.warn(`${tag} Safety still active — professional care needed`);
    return {
      reassessmentCount: count,
      completedAgents: [...completed, '__reassessment__'],
      nextAction: 'care',
      activeAgent: 'reassessment',
      triggeredEvents: [...(state.triggeredEvents || []), `REASSESSMENT_${count}_SAFETY_ESCALATION`]
    };
  }

  // ── Check which core agents still need to run ─────────────────────────────
  const coreAgents = [
    'Recovery and Wellness Agent',
    'Physical Activity Agent',
    'Psychological Support Agent'
  ];

  const stillNeeded = coreAgents.filter(a => !completed.includes(a));

  // Check if recovery output has alertness flag → needs care
  const recoveryAlertness = state.recoveryWellness?.flags?.includes('ALERTNESS_SAFETY_FLAG');
  if (recoveryAlertness && !completed.includes('Professional Support Pathway')) {
    observations.push('Recovery alertness safety flag detected');
    stillNeeded.push('Professional Support Pathway');
  }

  // ── Determine journey completion ──────────────────────────────────────
  const isComplete = stillNeeded.length === 0;

  logger.info(`${tag} Observations: ${observations.join('; ') || 'All core agent activities evaluated'}`);
  logger.info(`${tag} Still needed: ${stillNeeded.join(', ') || 'none'}`);
  logger.info(`${tag} Complete: ${isComplete}`);

  // Build reassessment summary for display
  const summary = {
    iteration: count,
    completedAgents: completed,
    observations,
    stillNeeded,
    mmwbi: state.mmwbi,
    recoveryWellnessIndex: state.recoveryWellness?.result?.recoveryWellnessIndex,
    isComplete,
    timestamp: new Date().toISOString()
  };

  return {
    reassessmentCount: count,
    completedAgents: [...completed, '__reassessment__'],
    activeAgent: 'reassessment',
    // Pass assessment to the wellness plan or let router handle it
    journeyStatus: isComplete ? 'completing' : 'in_progress',
    triggeredEvents: [
      ...(state.triggeredEvents || []),
      `REASSESSMENT_${count}_COMPLETE`
    ],
    // Store for the timeline display
    detectedFlags: [
      ...(state.detectedFlags || []),
      ...(observations.length > 0 ? [`REASSESSMENT_${count}_FLAGGED`] : [])
    ],
    error: null
  };
}

/**
 * Conditional edge from reassessment node.
 * Determines whether to continue routing or end.
 */
export function routeAfterReassessment(state) {
  const tag = '[LANGGRAPH][Router after reassessment]';

  if (state.crisisDetected || state.highRiskDetected) {
    if (!state.completedAgents?.includes('Professional Support Pathway')) {
      logger.warn(`${tag} → care (safety)`);
      return 'care';
    }
  }

  const completed = state.completedAgents || [];

  const coreAgents = [
    'Recovery and Wellness Agent',
    'Physical Activity Agent',
    'Psychological Support Agent'
  ];

  const remainingAgents = coreAgents.filter(a => !completed.includes(a));

  if (remainingAgents.length > 0) {
    logger.info(`${tag} → reasoning_router (${remainingAgents.length} agents remaining: ${remainingAgents.join(', ')})`);
    return 'reasoning_router';
  }

  logger.info(`${tag} → wellness_plan (all 3 core agents completed)`);
  return 'wellness_plan';
}

