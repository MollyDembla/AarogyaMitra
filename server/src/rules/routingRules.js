/**
 * Rule-Based Decision Engine for AarogyaMitra Reasoning and Decision-Making Agent.
 * Evaluates the complete report, domain scores, safety flags, and completed agent history
 * to deterministically route the user to the agent matching their highest-priority domain requirement.
 */

export function analyzeDomainPriorities(domainScores = {}) {
  const domains = [
    { key: 'physicalHealth', name: 'Physical Health', score: Number(domainScores.physicalHealth ?? domainScores.physicalActivity ?? 50), targetAgent: 'Physical Activity Agent' },
    { key: 'recoveryWellness', name: 'Recovery and Wellness', score: Number(domainScores.recoveryWellness ?? domainScores.lifestyle ?? 50), targetAgent: 'Recovery and Wellness Agent' },
    { key: 'psychologicalWellbeing', name: 'Psychological Well-Being', score: Number(domainScores.psychologicalWellbeing ?? domainScores.psychological ?? 50), targetAgent: 'Psychological Support Agent' },
    { key: 'socialWellbeing', name: 'Social Well-Being', score: Number(domainScores.socialWellbeing ?? 50), targetAgent: 'Recovery and Wellness Agent' },
    { key: 'lifestyleBalance', name: 'Lifestyle Balance', score: Number(domainScores.lifestyleBalance ?? domainScores.lifestyle ?? 50), targetAgent: 'Recovery and Wellness Agent' },
    { key: 'stressResilience', name: 'Stress Resilience and Management', score: Number(domainScores.stressResilience ?? 50), targetAgent: 'Psychological Support Agent' }
  ];

  // Sort ascending by score (lowest score = highest priority for attention)
  domains.sort((a, b) => a.score - b.score);
  return domains;
}

export const routingRules = [
  {
    name: 'Professional Support Pathway',
    description: 'Triggered when acute safety flags, PHQ-9 Q9 > 0, severe depression, or Critical Risk is detected.',
    evaluate: (context) => {
      if (context.safetyFlags && context.safetyFlags.length > 0) return true;
      if (context.riskLevel === 'Critical Risk' || (context.mmwbi !== undefined && context.mmwbi < 20)) return true;
      if (context.psychometricScores?.phq9?.severity === 'Severe' || context.psychometricScores?.gad7?.severity === 'Severe') return true;
      return false;
    },
    getReason: (context) => {
      const flagMsg = context.safetyFlags?.[0]?.message || 'Acute safety screening thresholds reached.';
      return `Safety override triggered: ${flagMsg} Immediate navigation to Professional Support Pathway resources is prioritized.`;
    }
  },
  {
    name: 'Psychological Support Agent',
    description: 'Triggered when Psychological Well-Being or Stress Resilience is identified as the primary focus domain.',
    evaluate: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const topNeed = priorities[0];
      const secondNeed = priorities[1];

      return (
        (topNeed.targetAgent === 'Psychological Support Agent' && topNeed.score < 75) ||
        (secondNeed?.targetAgent === 'Psychological Support Agent' && secondNeed.score < 60) ||
        context.attentionFlags?.includes('psychological_support_needed') ||
        context.attentionFlags?.includes('stress_management_needed')
      );
    },
    getReason: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const psychDomain = priorities.find(d => d.key === 'psychologicalWellbeing') || priorities[0];
      const stressDomain = priorities.find(d => d.key === 'stressResilience') || priorities[0];
      return `Report analysis indicates elevated psychological strain or stress burden. Psychological Well-Being is rated at ${psychDomain.score}/100 and Stress Resilience at ${stressDomain.score}/100, making guided coping and mindfulness the highest priority action.`;
    }
  },
  {
    name: 'Physical Activity Agent',
    description: 'Triggered when Physical Health is identified as the primary focus domain and no severe physical limitation prevents movement.',
    evaluate: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const physDomain = priorities.find(d => d.key === 'physicalHealth');
      const limit = String(context.rawFeaturePayload?.Physical_Limitation ?? context.physicalLimitation ?? 'None');

      return (
        physDomain && physDomain.score < 75 && limit !== 'Severe'
      );
    },
    getReason: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const physDomain = priorities.find(d => d.key === 'physicalHealth') || priorities[0];
      return `Report analysis indicates Physical Health (${physDomain.score}/100) requires structured attention. Guided movement evaluation, pose analysis, and stability routines are recommended.`;
    }
  },
  {
    name: 'Recovery and Wellness Agent',
    description: 'Triggered when Sleep Recovery, Lifestyle Balance, or Social Well-Being requires structured routine planning.',
    evaluate: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const recDomain = priorities.find(d => d.key === 'recoveryWellness') || priorities[0];
      return recDomain.score < 80;
    },
    getReason: (context) => {
      const priorities = analyzeDomainPriorities(context.domainScores);
      const recDomain = priorities.find(d => d.key === 'recoveryWellness') || priorities[0];
      const lifeDomain = priorities.find(d => d.key === 'lifestyleBalance') || priorities[0];
      return `Report analysis shows Recovery & Wellness (${recDomain.score}/100) and Lifestyle Balance (${lifeDomain.score}/100) require optimization. A tailored recovery schedule and habit balance routine is recommended.`;
    }
  }
];
