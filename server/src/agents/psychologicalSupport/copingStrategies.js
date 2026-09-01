/**
 * Rule-based coping strategy selector for Psychological Support Agent.
 * Selects strategies based on emotional state, stress level, and assessment scores.
 */

const COPING_STRATEGIES = {
  breathing: {
    id: 'breathing',
    title: '4-7-8 Breathing',
    duration: '5 mins',
    category: 'relaxation',
    description: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4 times. Activates the parasympathetic nervous system.',
    bestFor: ['high stress', 'anxiety', 'acute distress', 'panic']
  },
  boxBreathing: {
    id: 'box_breathing',
    title: 'Box Breathing',
    duration: '5 mins',
    category: 'relaxation',
    description: 'Inhale 4 counts, hold 4 counts, exhale 4 counts, hold 4 counts. Used by military personnel for stress control.',
    bestFor: ['moderate stress', 'focus', 'calming']
  },
  progressiveMuscleRelaxation: {
    id: 'pmr',
    title: 'Progressive Muscle Relaxation',
    duration: '10 mins',
    category: 'relaxation',
    description: 'Systematically tense and release muscle groups from feet to face. Reduces physical tension held in the body.',
    bestFor: ['physical tension', 'chronic stress', 'sleep difficulty']
  },
  structuredProblemSolving: {
    id: 'problem_solving',
    title: 'Structured Problem Solving',
    duration: '15 mins',
    category: 'cognitive',
    description: 'Define the problem → Generate solutions → Evaluate options → Choose and act → Review outcome. A systematic approach to overwhelming challenges.',
    bestFor: ['overwhelm', 'work stress', 'decision paralysis']
  },
  gratitudeJournal: {
    id: 'gratitude_journal',
    title: 'Gratitude Reflection',
    duration: '5 mins',
    category: 'journaling',
    description: 'Write 3 specific things you are grateful for today and why. Research shows consistent practice improves mood over time.',
    bestFor: ['low mood', 'negativity bias', 'mild depression']
  },
  selfCompassion: {
    id: 'self_compassion',
    title: 'Self-Compassion Pause',
    duration: '5 mins',
    category: 'emotional',
    description: 'Place your hand on your heart. Acknowledge the difficulty. Remind yourself: "Suffering is part of life. May I be kind to myself right now."',
    bestFor: ['shame', 'self-criticism', 'perfectionism', 'failure feelings']
  },
  mindfulBodyScan: {
    id: 'body_scan',
    title: 'Mindful Body Scan',
    duration: '10 mins',
    category: 'mindfulness',
    description: 'Slowly bring attention from feet to head, noticing sensations without judgment. Reconnects mind and body.',
    bestFor: ['dissociation', 'overwhelm', 'emotional flooding', 'grounding']
  },
  guidedVisualization: {
    id: 'visualization',
    title: 'Safe Place Visualization',
    duration: '8 mins',
    category: 'mindfulness',
    description: 'Close your eyes and vividly imagine a place where you feel completely safe, calm, and peaceful. Engage all senses.',
    bestFor: ['anxiety', 'trauma response', 'acute distress']
  },
  behavioralActivationSmall: {
    id: 'small_action',
    title: 'One Small Action',
    duration: '10 mins',
    category: 'behavioral',
    description: 'Identify one small meaningful action you can take in the next hour. Do it. Small wins build momentum.',
    bestFor: ['low motivation', 'depression', 'avoidance', 'procrastination']
  },
  emotionalLabeling: {
    id: 'emotion_labeling',
    title: 'Name It to Tame It',
    duration: '3 mins',
    category: 'emotional',
    description: 'Pause and name the specific emotion you are experiencing (e.g., "I feel anxious about..."). Research shows labeling emotions reduces their intensity.',
    bestFor: ['emotional flooding', 'confusion', 'overwhelm']
  }
};

/**
 * Selects coping strategies based on user's current state and context.
 * @param {string} userMessage
 * @param {number} stressLevel - 1-10
 * @param {string} primaryConcern - Main area of concern
 * @param {object} psychometricScores
 * @returns {Array} Recommended coping strategies
 */
export function selectCopingStrategies(userMessage = '', stressLevel = 5, primaryConcern = '', psychometricScores = {}) {
  const text = (userMessage + ' ' + primaryConcern).toLowerCase();
  const recommended = [];

  const gadScore = psychometricScores?.gad7?.score || 0;
  const phqScore = psychometricScores?.phq9?.score || 0;

  // High acute stress / panic
  if (stressLevel >= 8 || text.includes('panic') || text.includes('overwhelmed')) {
    recommended.push(COPING_STRATEGIES.breathing);
    recommended.push(COPING_STRATEGIES.mindfulBodyScan);
    return recommended.slice(0, 3);
  }

  // Anxiety-driven (high GAD-7 or text signals)
  if (gadScore >= 10 || text.includes('anxi') || text.includes('worried') || text.includes('fear')) {
    recommended.push(COPING_STRATEGIES.boxBreathing);
    recommended.push(COPING_STRATEGIES.guidedVisualization);
    recommended.push(COPING_STRATEGIES.emotionalLabeling);
    return recommended.slice(0, 3);
  }

  // Depressive / low motivation (high PHQ-9 or text signals)
  if (phqScore >= 10 || text.includes('sad') || text.includes('depressed') || text.includes('unmotivated') || text.includes('worthless')) {
    recommended.push(COPING_STRATEGIES.selfCompassion);
    recommended.push(COPING_STRATEGIES.behavioralActivationSmall);
    recommended.push(COPING_STRATEGIES.gratitudeJournal);
    return recommended.slice(0, 3);
  }

  // Work / problem-based stress
  if (text.includes('work') || text.includes('deadline') || text.includes('decision') || text.includes('stress')) {
    recommended.push(COPING_STRATEGIES.structuredProblemSolving);
    recommended.push(COPING_STRATEGIES.breathing);
    recommended.push(COPING_STRATEGIES.progressiveMuscleRelaxation);
    return recommended.slice(0, 3);
  }

  // Shame / self-criticism
  if (text.includes('shame') || text.includes('fail') || text.includes('worthless') || text.includes('stupid')) {
    recommended.push(COPING_STRATEGIES.selfCompassion);
    recommended.push(COPING_STRATEGIES.emotionalLabeling);
    return recommended.slice(0, 3);
  }

  // Default mix
  recommended.push(COPING_STRATEGIES.breathing);
  recommended.push(COPING_STRATEGIES.emotionalLabeling);
  recommended.push(COPING_STRATEGIES.gratitudeJournal);
  return recommended.slice(0, 3);
}

/**
 * Generates guided journal prompts based on user context.
 */
export function getJournalPrompts(emotionalState = '') {
  const state = emotionalState.toLowerCase();

  if (state.includes('anxi') || state.includes('stress')) {
    return [
      'What is worrying me most right now?',
      'What is the worst that could realistically happen? How likely is that?',
      'What has helped me get through similar situations before?',
      'What would I tell a good friend who was feeling this way?'
    ];
  }

  if (state.includes('sad') || state.includes('depressed')) {
    return [
      'What happened today that I found even slightly pleasant or manageable?',
      'What is one thing I am grateful for right now, even if it is small?',
      'What is one small step I could take tomorrow to feel slightly better?',
      'When did I last feel better? What was different then?'
    ];
  }

  // General
  return [
    'How am I feeling right now, and what might be contributing to this?',
    'What happened today that affected my mood or energy?',
    'What emotion did I experience most strongly today?',
    'What helped me today? What would I like to try next time?'
  ];
}
