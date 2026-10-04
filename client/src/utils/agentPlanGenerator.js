import { Shield, Brain, Activity, Moon } from 'lucide-react';

export const AGENT_DEFINITIONS = {
  'professional-support': {
    key: 'professional-support',
    name: 'Professional Care',
    fullName: 'Professional Support Pathway',
    shortLabel: 'Professional Care',
    path: '/agent/professional-support',
    icon: Shield,
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fef3c7',
    badge: 'Immediate Safety'
  },
  'psychological-support': {
    key: 'psychological-support',
    name: 'Psychological Support',
    fullName: 'Psychological Support Agent',
    shortLabel: 'Guided Care (Psych)',
    path: '/agent/psychological-support',
    icon: Brain,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    badge: 'Guided Care & Coping'
  },
  'physical-activity': {
    key: 'physical-activity',
    name: 'Physical Activity',
    fullName: 'Physical Activity Agent',
    shortLabel: 'Exercise & Movement',
    path: '/agent/physical-activity',
    icon: Activity,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    badge: 'Guided Exercise'
  },
  'recovery-wellness': {
    key: 'recovery-wellness',
    name: 'Recovery & Wellness',
    fullName: 'Recovery and Wellness Agent',
    shortLabel: 'Care & Recovery Plan',
    path: '/agent/recovery-wellness',
    icon: Moon,
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: 'Personalized Routine'
  }
};

export function canonicalKey(raw) {
  if (!raw) return '';
  const s = String(raw).toLowerCase().replace(/[-_ &]/g, '');
  if (s.includes('professional') || s.includes('care')) return 'professional-support';
  if (s.includes('psycho')) return 'psychological-support';
  if (s.includes('physic')) return 'physical-activity';
  if (s.includes('recovery') || s.includes('wellnessagent') || s.includes('wellness')) return 'recovery-wellness';
  if (s.includes('assessment')) return 'wellness_assessment';
  return s;
}

/**
 * Dynamically generates a consistent, multi-step agentic plan flow
 * based on user assessment inputs, domain scores, safety flags, and completed agent history.
 */
export function generateAgenticPlan(wellnessData) {
  if (!wellnessData?.result) {
    return {
      plan: [],
      currentStep: null,
      nextStep: null,
      progressPercent: 0,
      completedCount: 0,
      totalSteps: 0
    };
  }

  const result = wellnessData.result || {};
  const domainScores = result.domainScores || {};
  const safetyFlags = result.safetyFlags || [];
  const psychometric = result.psychometricScores || {};
  const completedAgents = wellnessData.journey?.completedAgents || [];

  const rawLimitation = String(result.rawFeaturePayload?.Physical_Limitation ?? 'None');

  const rawPlanKeys = [];
  const reasonsMap = {};

  // 1. Safety Trigger Check (Professional Care MUST be step 1 if safety flags exist or PHQ9 Q9 > 0)
  const isSevereDepression = psychometric.phq9?.severity === 'Severe';
  const isSevereAnxiety = psychometric.gad7?.severity === 'Severe';
  const isCriticalRisk = result.userFacingRiskLabel === 'Critical Risk' || result.wellnessCategory === 'Critical Risk';
  const hasSafetyFlags = safetyFlags.length > 0;

  if (hasSafetyFlags || isSevereDepression || isSevereAnxiety || isCriticalRisk) {
    rawPlanKeys.push('professional-support');
    reasonsMap['professional-support'] = safetyFlags?.[0]?.message ||
      'Safety screening indicates elevated distress. Immediate navigation to Professional Care resources is prioritized.';
  }

  // 2. Analyze Domain Needs (Order non-safety agents by domain score ascending: lowest score = highest need)
  const domainCandidates = [
    {
      key: 'psychological-support',
      score: Math.min(
        Number(domainScores.psychologicalWellbeing ?? 50),
        Number(domainScores.stressResilience ?? 50)
      ),
      evaluate: () => {
        const psychScore = domainScores.psychologicalWellbeing ?? 50;
        const stressScore = domainScores.stressResilience ?? 50;
        return psychScore < 75 || stressScore < 75 || (psychometric.phq9?.score ?? 0) > 4 || (psychometric.gad7?.score ?? 0) > 4;
      },
      reason: `Report analysis indicates psychological strain (Well-Being: ${(domainScores.psychologicalWellbeing ?? 50).toFixed(1)}/100, Stress Resilience: ${(domainScores.stressResilience ?? 50).toFixed(1)}/100). Guided CBT coping & mindfulness is prioritized.`
    },
    {
      key: 'physical-activity',
      score: Number(domainScores.physicalHealth ?? 50),
      evaluate: () => {
        const physScore = domainScores.physicalHealth ?? 50;
        return physScore < 75 && rawLimitation !== 'Severe';
      },
      reason: `Physical Health rated at ${(domainScores.physicalHealth ?? 50).toFixed(1)}/100. Guided movement evaluation, pose analysis, and stability exercises are recommended.`
    },
    {
      key: 'recovery-wellness',
      score: Math.min(
        Number(domainScores.recoveryWellness ?? 50),
        Number(domainScores.lifestyleBalance ?? 50),
        Number(domainScores.sleepRecovery ?? 50)
      ),
      evaluate: () => true, // Always included for routine planning / recovery
      reason: `Recovery & Wellness (${(domainScores.recoveryWellness ?? 50).toFixed(1)}/100) and Lifestyle Balance require structured routine optimization and habit tracking.`
    }
  ];

  // Sort candidates by score ascending (lowest score = highest priority for attention)
  domainCandidates.sort((a, b) => a.score - b.score);

  // Add all domain agents to plan in score priority order
  domainCandidates.forEach(cand => {
    if (!rawPlanKeys.includes(cand.key)) {
      rawPlanKeys.push(cand.key);
      reasonsMap[cand.key] = cand.reason;
    }
  });

  // Helper to check if an agent is completed
  const isAgentDone = (agentDef) => {
    const targetKey = canonicalKey(agentDef.key || agentDef.name || agentDef.fullName);
    return completedAgents.some(c => canonicalKey(c) === targetKey);
  };

  // Find index of current active step (first non-completed step in plan)
  let currentStepIdx = rawPlanKeys.findIndex(key => !isAgentDone(AGENT_DEFINITIONS[key]));
  if (currentStepIdx === -1) {
    currentStepIdx = rawPlanKeys.length - 1;
  }

  const plan = rawPlanKeys.map((key, idx) => {
    const def = AGENT_DEFINITIONS[key];
    const completed = isAgentDone(def);
    const isCurrent = idx === currentStepIdx && (!completed || idx === rawPlanKeys.length - 1);

    let status = 'upcoming';
    if (completed) status = 'completed';
    else if (isCurrent) status = 'current';

    return {
      stepNumber: idx + 1,
      ...def,
      reason: reasonsMap[key] || def.stepDescription || '',
      status,
      isCompleted: completed,
      isCurrent: status === 'current',
      isUpcoming: status === 'upcoming'
    };
  });

  const currentStep = plan.find(s => s.isCurrent) || plan[0] || null;
  const currentIdx = plan.findIndex(s => s.key === currentStep?.key);
  const nextStep = plan.slice(currentIdx >= 0 ? currentIdx + 1 : 0).find(s => !s.isCompleted) || null;

  const completedCount = plan.filter(s => s.isCompleted).length;
  const progressPercent = plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0;

  return {
    plan,
    currentStep,
    nextStep,
    progressPercent,
    completedCount,
    totalSteps: plan.length
  };
}
