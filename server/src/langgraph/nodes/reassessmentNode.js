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

  // ── Check which agents still need to run ─────────────────────────────
  const priorities = analyzeDomainPriorities(domainScores);
  const observations = [];
  const stillNeeded = [];

  // Check recovery
  if (domainScores.recoveryWellness < 50 && !completed.includes('Recovery and Wellness Agent')) {
    observations.push(`Recovery score (${domainScores.recoveryWellness?.toFixed(0)}/100) still below threshold`);
    stillNeeded.push('Recovery and Wellness Agent');
  }

  // Check psychological — stress still elevated after recovery
  if (domainScores.stressResilience < 45 && !completed.includes('Psychological Support Agent')) {
    observations.push(`Stress resilience (${domainScores.stressResilience?.toFixed(0)}/100) remains elevated`);
    stillNeeded.push('Psychological Support Agent');
    logger.info(`${tag} Elevated stress detected — Psychological Support still needed`);
  }

  // Check physical
  if (domainScores.physicalHealth < 45 && !completed.includes('Physical Activity Agent')) {
    observations.push(`Physical health (${domainScores.physicalHealth?.toFixed(0)}/100) requires attention`);
    stillNeeded.push('Physical Activity Agent');
  }

  // Check if recovery output has alertness flag → needs care
  const recoveryAlertness = state.recoveryWellness?.flags?.includes('ALERTNESS_SAFETY_FLAG');
  if (recoveryAlertness && !completed.includes('Professional Support Pathway')) {
    observations.push('Recovery alertness safety flag detected');
    stillNeeded.push('Professional Support Pathway');
  }

  // ── Determine journey completion ──────────────────────────────────────
  const hasEnoughAgents = completed.filter(a =>
    ['Recovery and Wellness Agent', 'Physical Activity Agent', 'Psychological Support Agent'].includes(a)
  ).length >= 1;

  const isComplete = stillNeeded.length === 0 && hasEnoughAgents;

  logger.info(`${tag} Observations: ${observations.join('; ') || 'All thresholds met'}`);
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
  const domainScores = state.domainScores || {};

  // Check if any agent still needs to run
  const needsRecovery = domainScores.recoveryWellness < 50 && !completed.includes('Recovery and Wellness Agent');
  const needsPsych = domainScores.stressResilience < 45 && !completed.includes('Psychological Support Agent');
  const needsPhysical = domainScores.physicalHealth < 45 && !completed.includes('Physical Activity Agent');

  if (needsRecovery || needsPsych || needsPhysical) {
    logger.info(`${tag} → reasoning_router (more agents needed)`);
    return 'reasoning_router';
  }

  logger.info(`${tag} → wellness_plan`);
  return 'wellness_plan';
}
