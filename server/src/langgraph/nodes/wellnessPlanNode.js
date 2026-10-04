/**
 * LangGraph Node: Wellness Plan Generator
 *
 * Final node in the happy path. Synthesizes outputs from ALL
 * completed agents into a cohesive, personalized wellness plan.
 *
 * This is the END state of the graph (unless professional care was needed).
 */
import AgentResult from '../../models/AgentResult.js';
import AgentJourney from '../../models/AgentJourney.js';
import { logger } from '../../utils/logger.js';

/**
 * @param {Object} state - WellnessGraphState
 * @returns {Object} state patch
 */
export async function wellnessPlanNode(state) {
  const tag = '[LANGGRAPH][Node: wellness_plan]';
  logger.info(`${tag} Generating final wellness plan — completedAgents=${JSON.stringify(state.completedAgents)}`);

  try {
    const completed = state.completedAgents || [];
    const domainScores = state.domainScores || {};

    // ── Synthesize from all agent outputs ────────────────────────────────
    const planSections = [];

    // Assessment summary
    planSections.push({
      section: 'wellness_assessment',
      title: 'Wellness Assessment Summary',
      content: {
        mmwbi: state.mmwbi,
        riskLevel: state.userFacingRiskLabel || state.riskLevel,
        domainScores,
        primaryConcerns: state.primaryConcerns,
        strengths: state.strengths
      },
      completed: true
    });

    // Recovery & Wellness section
    if (state.recoveryWellness && completed.includes('Recovery and Wellness Agent')) {
      const rw = state.recoveryWellness.result;
      planSections.push({
        section: 'recovery_wellness',
        title: 'Recovery & Wellness Plan',
        content: {
          recoveryWellnessIndex: rw.recoveryWellnessIndex,
          overallRecoveryLevel: rw.overallRecoveryLevel,
          primaryConcern: rw.primaryConcern,
          recoverySummary: rw.recoverySummary,
          recommendations: state.recoveryWellness.recommendations || []
        },
        completed: true
      });
    }

    // Physical Activity section
    if (state.physicalActivity && completed.includes('Physical Activity Agent')) {
      const pa = state.physicalActivity.result;
      planSections.push({
        section: 'physical_activity',
        title: 'Physical Activity Assessment',
        content: {
          overallAccuracy: pa.overallAccuracy,
          formGrade: pa.formGrade,
          mobilityIndicator: pa.mobilityIndicator,
          recommendations: state.physicalActivity.recommendations || []
        },
        completed: true
      });
    }

    // Psychological Support section
    if (state.psychologicalSupport && completed.includes('Psychological Support Agent')) {
      const ps = state.psychologicalSupport.result;
      planSections.push({
        section: 'psychological_support',
        title: 'Psychological Well-Being Support',
        content: {
          emotionalState: ps.emotionalState,
          riskLevel: ps.riskLevel,
          copingStrategies: ps.copingStrategies?.slice(0, 3) || [],
          recommendations: state.psychologicalSupport.recommendations || []
        },
        completed: true
      });
    }

    // Professional Care section
    if (state.careNavigation && completed.includes('Professional Support Pathway')) {
      const cn = state.careNavigation.result;
      planSections.push({
        section: 'professional_care',
        title: 'Professional Care Navigation',
        content: {
          careLevel: cn.careLevel,
          urgency: cn.urgency,
          professionalType: cn.professionalType,
          nextSteps: cn.nextSteps?.slice(0, 3) || [],
          urgencyDescription: cn.urgencyDescription
        },
        completed: true
      });
    }

    // ── Build final plan ──────────────────────────────────────────────────
    const allRecommendations = [...new Set(state.recommendations || [])].filter(Boolean);

    // Prioritized next steps
    const nextSteps = [];
    if (domainScores.recoveryWellness < 50) nextSteps.push('Implement sleep hygiene improvements within the next 7 days');
    if (domainScores.stressResilience < 50) nextSteps.push('Practice daily stress-reduction techniques (breathing, grounding)');
    if (domainScores.physicalHealth < 50) nextSteps.push('Begin gentle movement routine 3-4 times per week');
    if (domainScores.psychologicalWellbeing < 50) nextSteps.push('Schedule regular check-ins with psychological support');
    if (state.careNavigation) nextSteps.push('Follow professional care recommendations and book consultation');
    if (nextSteps.length === 0) nextSteps.push('Continue monitoring wellness and re-assess in 30 days');

    const wellnessPlan = {
      agentName: 'wellness_plan',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      sessionId: state.sessionId,

      summary: {
        mmwbi: state.mmwbi,
        riskLevel: state.userFacingRiskLabel || state.riskLevel,
        agentsCompleted: completed.filter(a => !a.startsWith('__')),
        overallStatus: state.highRiskDetected ? 'requires_professional_attention'
          : state.mmwbi >= 70 ? 'good'
          : state.mmwbi >= 50 ? 'moderate'
          : 'needs_attention'
      },

      planSections,
      recommendations: allRecommendations.slice(0, 10),
      nextSteps,
      detectedFlags: state.detectedFlags || [],
      triggeredEvents: state.triggeredEvents || [],

      // Agent journey narrative for display
      agentJourneyNarrative: buildJourneyNarrative(state),

      disclaimer: 'AarogyaMitra wellness plan is a personalized guide generated from your assessment and agent interactions. It is not a clinical diagnosis. Please consult qualified healthcare professionals for medical concerns.'
    };

    // Persist final plan as AgentResult
    if (state.journeyId) {
      const result = await AgentResult.create({
        user: state.userId,
        journey: state.journeyId,
        agentName: 'Recovery and Wellness Agent', // closest existing enum
        inputContext: { type: 'WELLNESS_PLAN_SYNTHESIS', sessionId: state.sessionId },
        outputData: wellnessPlan
      });

      // Mark journey complete
      await AgentJourney.findByIdAndUpdate(state.journeyId, {
        status: 'completed',
        currentAgent: 'Wellness Plan',
        $push: {
          steps: {
            agentName: 'Wellness Plan Generator',
            resultId: result._id,
            visitedAt: new Date()
          }
        }
      });
    }

    logger.info(`${tag} Wellness plan generated — sections=${planSections.length} recommendations=${allRecommendations.length}`);

    return {
      wellnessPlan,
      activeAgent: 'wellness_plan',
      journeyStatus: 'completed',
      completedAgents: [...(state.completedAgents || []), '__wellness_plan__'],
      error: null,
      failedNode: null
    };

  } catch (err) {
    logger.error(`${tag} FAILED — ${err.message}`);
    return {
      error: err.message,
      failedNode: 'wellness_plan',
      journeyStatus: 'error'
    };
  }
}

function buildJourneyNarrative(state) {
  const steps = [];
  const completed = state.completedAgents || [];

  steps.push({
    agent: 'Wellness Assessment',
    status: 'completed',
    description: `MMWBI calculated: ${state.mmwbi}/100 (${state.userFacingRiskLabel || state.riskLevel})`
  });

  if (completed.includes('Recovery and Wellness Agent')) {
    const rwi = state.recoveryWellness?.result?.recoveryWellnessIndex;
    steps.push({
      agent: 'Recovery & Wellness',
      status: 'completed',
      description: rwi ? `Recovery Index: ${rwi}/100 — ${state.recoveryWellness?.result?.overallRecoveryLevel}` : 'Recovery plan generated'
    });
  }

  if (completed.includes('Physical Activity Agent')) {
    const acc = state.physicalActivity?.result?.overallAccuracy;
    steps.push({
      agent: 'Physical Activity',
      status: 'completed',
      description: acc ? `Pose evaluation: ${acc}% accuracy` : 'Physical activity evaluated'
    });
  }

  if (completed.includes('Psychological Support Agent')) {
    const trigger = state.detectedFlags?.includes('PSYCH_HIGH_CONCERN')
      ? 'Triggered by elevated stress indicators from recovery assessment'
      : 'Psychological support session completed';
    steps.push({
      agent: 'Psychological Support',
      status: 'completed',
      description: trigger
    });
  }

  if (completed.includes('Professional Support Pathway')) {
    const reason = state.crisisDetected ? 'Crisis intervention required'
      : state.highRiskDetected ? 'High-risk indicators detected'
      : 'Care navigation completed';
    steps.push({
      agent: 'Professional Care Navigation',
      status: 'completed',
      description: reason
    });
  }

  steps.push({
    agent: 'Wellness Plan',
    status: 'completed',
    description: 'Personalized wellness plan synthesized from all agent outputs'
  });

  return steps;
}
