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
    { key: 'stressResilience', name: 'Stress Resilience', score: Number(domainScores.stressResilience ?? 50), targetAgent: 'Psychological Support Agent' }
  ];

  // Sort ascending by score (lowest score = highest deficit = highest priority for attention)
  domains.sort((a, b) => a.score - b.score);
  return domains;
}

export function getPrioritizedRules(context) {
  const priorities = analyzeDomainPriorities(context.domainScores || {});

  // Map target agents to their minimum domain score for this user
  const agentScoreMap = {};
  priorities.forEach(d => {
    if (agentScoreMap[d.targetAgent] === undefined || d.score < agentScoreMap[d.targetAgent]) {
      agentScoreMap[d.targetAgent] = d.score;
    }
  });

  const baseRules = [
    {
      name: 'Professional Support Pathway',
      priorityScore: (context.safetyFlags?.length > 0 || context.riskLevel === 'Critical Risk' || (context.mmwbi !== undefined && context.mmwbi < 20)) ? -100 : 999,
      evaluate: (ctx) => {
        if (ctx.safetyFlags && ctx.safetyFlags.length > 0) return true;
        if (ctx.riskLevel === 'Critical Risk' || (ctx.mmwbi !== undefined && ctx.mmwbi < 20)) return true;
        if (ctx.psychometricScores?.phq9?.severity === 'Severe' || ctx.psychometricScores?.gad7?.severity === 'Severe') return true;
        return false;
      },
      getReason: (ctx) => {
        const flagMsg = ctx.safetyFlags?.[0]?.message || 'Acute safety screening thresholds reached.';
        return `Safety override triggered: ${flagMsg} Immediate navigation to Professional Support Pathway resources is prioritized.`;
      }
    },
    {
      name: 'Recovery and Wellness Agent',
      priorityScore: agentScoreMap['Recovery and Wellness Agent'] ?? 50,
      evaluate: (ctx) => !ctx.completedAgents?.includes('Recovery and Wellness Agent'),
      getReason: (ctx) => {
        const priorities = analyzeDomainPriorities(ctx.domainScores);
        const recDomain = priorities.find(d => d.targetAgent === 'Recovery and Wellness Agent') || priorities[0];
        return `${recDomain.name} rated at ${recDomain.score.toFixed(1)}/100. A tailored recovery schedule, sleep hygiene, and routine balance are prioritized.`;
      }
    },
    {
      name: 'Physical Activity Agent',
      priorityScore: agentScoreMap['Physical Activity Agent'] ?? 50,
      evaluate: (ctx) => !ctx.completedAgents?.includes('Physical Activity Agent'),
      getReason: (ctx) => {
        const priorities = analyzeDomainPriorities(ctx.domainScores);
        const physDomain = priorities.find(d => d.targetAgent === 'Physical Activity Agent') || priorities[0];
        return `${physDomain.name} rated at ${physDomain.score.toFixed(1)}/100. Guided movement evaluation, pose analysis, and physical activity routines are recommended.`;
      }
    },
    {
      name: 'Psychological Support Agent',
      priorityScore: agentScoreMap['Psychological Support Agent'] ?? 50,
      evaluate: (ctx) => !ctx.completedAgents?.includes('Psychological Support Agent'),
      getReason: (ctx) => {
        const priorities = analyzeDomainPriorities(ctx.domainScores);
        const psychDomain = priorities.find(d => d.targetAgent === 'Psychological Support Agent') || priorities[0];
        return `${psychDomain.name} rated at ${psychDomain.score.toFixed(1)}/100. Guided CBT coping, emotional reflection, and mindfulness activities are recommended.`;
      }
    }
  ];

  return baseRules
    .filter(rule => {
      if (rule.name === 'Professional Support Pathway') return rule.evaluate(context);
      return !context.completedAgents?.includes(rule.name);
    })
    .sort((a, b) => a.priorityScore - b.priorityScore);
}

export const routingRules = [
  {
    name: 'Professional Support Pathway',
    description: 'Triggered when acute safety flags or severe crisis is detected.',
    evaluate: (ctx) => getPrioritizedRules(ctx)[0]?.name === 'Professional Support Pathway',
    getReason: (ctx) => getPrioritizedRules(ctx)[0]?.getReason(ctx) || 'Safety override activated.'
  },
  {
    name: 'Psychological Support Agent',
    description: 'Prioritized dynamically based on psychological domain scores.',
    evaluate: (ctx) => getPrioritizedRules(ctx)[0]?.name === 'Psychological Support Agent',
    getReason: (ctx) => getPrioritizedRules(ctx)[0]?.getReason(ctx) || 'Psychological support prioritized.'
  },
  {
    name: 'Physical Activity Agent',
    description: 'Prioritized dynamically based on physical health domain scores.',
    evaluate: (ctx) => getPrioritizedRules(ctx)[0]?.name === 'Physical Activity Agent',
    getReason: (ctx) => getPrioritizedRules(ctx)[0]?.getReason(ctx) || 'Physical activity routines prioritized.'
  },
  {
    name: 'Recovery and Wellness Agent',
    description: 'Prioritized dynamically based on recovery/lifestyle domain scores.',
    evaluate: (ctx) => getPrioritizedRules(ctx)[0]?.name === 'Recovery and Wellness Agent',
    getReason: (ctx) => getPrioritizedRules(ctx)[0]?.getReason(ctx) || 'Recovery and lifestyle balance prioritized.'
  }
];
