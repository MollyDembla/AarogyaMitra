/**
 * AarogyaMitra LangGraph — Core Graph Definition
 *
 * This is the central orchestration engine.
 * It builds and compiles the StateGraph using LangGraph primitives.
 *
 * Graph topology:
 *
 * START
 *   ↓
 * wellness_assessment
 *   ↓
 * reasoning_router ──────────────────────────────┐
 *   ↓ (conditional edges)                        │
 * ┌─────────────────────────────────────┐         │
 * │ recovery  physical  psychological  │         │
 * │ care                               │         │
 * └─────────────────────────────────────┘         │
 *   ↓ (all → reassessment)                        │
 * reassessment                                    │
 *   ↓ (conditional edges)                         │
 * reasoning_router ◄──────────────────────────────┘
 *   OR
 * wellness_plan
 *   ↓
 * END
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { wellnessAssessmentNode } from './nodes/wellnessAssessmentNode.js';
import { reasoningRouterNode, routeFromState } from './nodes/reasoningRouterNode.js';
import { recoveryWellnessNode } from './nodes/recoveryWellnessNode.js';
import { physicalActivityNode } from './nodes/physicalActivityNode.js';
import { psychologicalSupportNode } from './nodes/psychologicalSupportNode.js';
import { professionalCareNode } from './nodes/professionalCareNode.js';
import { reassessmentNode, routeAfterReassessment } from './nodes/reassessmentNode.js';
import { wellnessPlanNode } from './nodes/wellnessPlanNode.js';
import { logger } from '../utils/logger.js';

// ── State annotation — LangGraph uses this to merge state patches ──────────
// LangGraph v0.2+ uses Annotation pattern. We implement a custom reducer.
// Since we're using plain objects (not TypeScript), we use the channel approach.

function mergeState(existing, update) {
  if (!update) return existing;
  const merged = { ...existing };
  for (const [key, value] of Object.entries(update)) {
    if (key === 'completedAgents' && Array.isArray(value)) {
      // Merge arrays without duplicates
      merged[key] = [...new Set([...(existing[key] || []), ...value])];
    } else if (key === 'recommendations' && Array.isArray(value)) {
      merged[key] = [...new Set([...(existing[key] || []), ...value])];
    } else if (key === 'detectedFlags' && Array.isArray(value)) {
      merged[key] = [...new Set([...(existing[key] || []), ...value])];
    } else if (key === 'triggeredEvents' && Array.isArray(value)) {
      merged[key] = [...new Set([...(existing[key] || []), ...value])];
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Build and compile the AarogyaMitra wellness StateGraph.
 * @returns {CompiledStateGraph}
 */
export function buildWellnessGraph() {
  logger.info('[LANGGRAPH] Building wellness graph...');

  // Create graph with state channels
  const graph = new StateGraph({
    channels: {
      // Use lastValue for all fields (default merge strategy)
      sessionId: { value: (x, y) => y ?? x, default: () => null },
      userId: { value: (x, y) => y ?? x, default: () => null },
      userName: { value: (x, y) => y ?? x, default: () => '' },
      assessmentData: { value: (x, y) => y ?? x, default: () => ({}) },
      assessmentId: { value: (x, y) => y ?? x, default: () => null },
      mmwbi: { value: (x, y) => y ?? x, default: () => null },
      riskLevel: { value: (x, y) => y ?? x, default: () => null },
      userFacingRiskLabel: { value: (x, y) => y ?? x, default: () => null },
      domainScores: { value: (x, y) => y ?? x, default: () => ({}) },
      psychometricScores: { value: (x, y) => y ?? x, default: () => ({}) },
      rawFeaturePayload: { value: (x, y) => y ?? x, default: () => ({}) },
      attentionFlags: { value: (a, b) => b ?? a, default: () => [] },
      safetyFlags: { value: (a, b) => b ?? a, default: () => [] },
      primaryConcerns: { value: (a, b) => b ?? a, default: () => [] },
      strengths: { value: (a, b) => b ?? a, default: () => [] },
      wellnessResultId: { value: (x, y) => y ?? x, default: () => null },
      recoveryWellness: { value: (x, y) => y ?? x, default: () => null },
      physicalActivity: { value: (x, y) => y ?? x, default: () => null },
      psychologicalSupport: { value: (x, y) => y ?? x, default: () => null },
      careNavigation: { value: (x, y) => y ?? x, default: () => null },
      wellnessPlan: { value: (x, y) => y ?? x, default: () => null },
      activeAgent: { value: (x, y) => y ?? x, default: () => null },
      // Arrays that accumulate across nodes
      completedAgents: {
        value: (a, b) => b ? [...new Set([...(a || []), ...(b || [])])] : (a || []),
        default: () => []
      },
      recommendations: {
        value: (a, b) => b ? [...new Set([...(a || []), ...(b || [])])] : (a || []),
        default: () => []
      },
      detectedFlags: {
        value: (a, b) => b ? [...new Set([...(a || []), ...(b || [])])] : (a || []),
        default: () => []
      },
      triggeredEvents: {
        value: (a, b) => b ? [...new Set([...(a || []), ...(b || [])])] : (a || []),
        default: () => []
      },
      pendingAgents: { value: (a, b) => b ?? a, default: () => [] },
      highRiskDetected: { value: (x, y) => y !== undefined ? y : x, default: () => false },
      crisisDetected: { value: (x, y) => y !== undefined ? y : x, default: () => false },
      nextAction: { value: (x, y) => y ?? x, default: () => null },
      routerDecision: { value: (x, y) => y ?? x, default: () => null },
      journeyStatus: { value: (x, y) => y ?? x, default: () => 'pending' },
      requiresUserAction: { value: (x, y) => y !== undefined ? y : x, default: () => false },
      userActionType: { value: (x, y) => y ?? x, default: () => null },
      userActionPayload: { value: (x, y) => y ?? x, default: () => null },
      userActionResult: { value: (x, y) => y ?? x, default: () => null },
      iterationCount: { value: (x, y) => y ?? x, default: () => 0 },
      maxIterations: { value: (x, y) => y ?? x, default: () => 8 },
      reassessmentCount: { value: (x, y) => y ?? x, default: () => 0 },
      journeyId: { value: (x, y) => y ?? x, default: () => null },
      checkpointData: { value: (x, y) => y ?? x, default: () => null },
      error: { value: (x, y) => y ?? x, default: () => null },
      lastError: { value: (x, y) => y ?? x, default: () => null },
      failedNode: { value: (x, y) => y ?? x, default: () => null }
    }
  });

  // ── Add Nodes ────────────────────────────────────────────────────────────
  graph.addNode('wellness_assessment', wellnessAssessmentNode);
  graph.addNode('reasoning_router', reasoningRouterNode);
  graph.addNode('recovery_wellness', recoveryWellnessNode);
  graph.addNode('physical_activity', physicalActivityNode);
  graph.addNode('psychological_support', psychologicalSupportNode);
  graph.addNode('professional_care', professionalCareNode);
  graph.addNode('reassessment', reassessmentNode);
  graph.addNode('wellness_plan', wellnessPlanNode);

  // ── Add Edges ────────────────────────────────────────────────────────────

  // Entry point
  graph.addEdge(START, 'wellness_assessment');

  // Assessment → Router (always)
  graph.addEdge('wellness_assessment', 'reasoning_router');

  // Router → Conditional edges (dynamic routing)
  graph.addConditionalEdges('reasoning_router', routeFromState, {
    recovery: 'recovery_wellness',
    physical: 'physical_activity',
    psychological: 'psychological_support',
    care: 'professional_care',
    reassessment: 'reassessment',
    wellness_plan: 'wellness_plan',
    awaiting_user: END  // Pause graph for user input
  });

  // After each agent → reassessment
  graph.addEdge('recovery_wellness', 'reassessment');
  graph.addEdge('physical_activity', 'reassessment');
  graph.addEdge('psychological_support', 'reassessment');
  graph.addEdge('professional_care', 'wellness_plan');

  // Reassessment → conditional routing (loop or complete)
  graph.addConditionalEdges('reassessment', routeAfterReassessment, {
    reasoning_router: 'reasoning_router',
    wellness_plan: 'wellness_plan',
    care: 'professional_care'
  });

  // Terminal node
  graph.addEdge('wellness_plan', END);

  // ── Compile ──────────────────────────────────────────────────────────────
  const compiled = graph.compile();

  logger.info('[LANGGRAPH] Wellness graph compiled successfully');
  logger.info('[LANGGRAPH] Nodes: wellness_assessment, reasoning_router, recovery_wellness, physical_activity, psychological_support, professional_care, reassessment, wellness_plan');

  return compiled;
}

// Export singleton compiled graph
let _compiledGraph = null;

export function getWellnessGraph() {
  if (!_compiledGraph) {
    _compiledGraph = buildWellnessGraph();
  }
  return _compiledGraph;
}
