/**
 * CBT Exercise Library for Psychological Support Agent.
 * Structured exercises based on Cognitive Behavioral Therapy principles.
 * These are psychoeducational wellness tools — not clinical therapy.
 */

export const CBT_EXERCISES = {
  thoughtRecord: {
    id: 'thought_record',
    title: 'Thought Record Exercise',
    description: 'Understand the connection between situations, thoughts, emotions, and behaviors.',
    steps: [
      {
        step: 1,
        label: 'Situation',
        prompt: 'Describe the situation that triggered your distress. What happened? Where were you? Who was involved?',
        example: 'I had a difficult conversation with my manager about missed deadlines.'
      },
      {
        step: 2,
        label: 'Automatic Thought',
        prompt: 'What was the first thought that came to your mind? What were you telling yourself?',
        example: '"I am a failure. I cannot do anything right."'
      },
      {
        step: 3,
        label: 'Emotion',
        prompt: 'What emotions did you experience? Rate each on a scale of 0–100.',
        example: 'Anxiety (80/100), Shame (70/100), Sadness (60/100)'
      },
      {
        step: 4,
        label: 'Evidence For',
        prompt: 'What evidence supports this thought being true?',
        example: 'I missed two deadlines this month.'
      },
      {
        step: 5,
        label: 'Evidence Against',
        prompt: 'What evidence suggests this thought may not be entirely accurate?',
        example: 'I have successfully completed 15 other projects. I was dealing with extra workload this month.'
      },
      {
        step: 6,
        label: 'Balanced Perspective',
        prompt: 'Based on all evidence, what is a more balanced and realistic way to view this situation?',
        example: '"I struggled with deadlines this month due to an unusually high workload. This does not define my overall capability."'
      },
      {
        step: 7,
        label: 'Outcome',
        prompt: 'How do you feel now? Rate your emotions again and notice any change.',
        example: 'Anxiety (55/100), Shame (40/100) — somewhat reduced'
      }
    ]
  },

  behavioralActivation: {
    id: 'behavioral_activation',
    title: 'Behavioral Activation',
    description: 'Break the cycle of low mood and inactivity by scheduling small, meaningful activities.',
    steps: [
      {
        step: 1,
        label: 'Notice the Pattern',
        prompt: 'When you feel low, what activities do you tend to avoid or stop doing?',
        example: 'Exercising, meeting friends, cooking meals.'
      },
      {
        step: 2,
        label: 'Choose One Small Activity',
        prompt: 'Choose one activity from your list — something small and manageable for today.',
        example: 'A 10-minute walk around the building.'
      },
      {
        step: 3,
        label: 'Schedule It',
        prompt: 'When will you do this activity today? Write the specific time.',
        example: 'Today at 5:30 PM, after work.'
      },
      {
        step: 4,
        label: 'Do It and Notice',
        prompt: 'After completing the activity, notice how you feel. Rate your mood before and after.',
        example: 'Before: 4/10. After: 6/10. Felt a slight lift in mood.'
      },
      {
        step: 5,
        label: 'Build Gradually',
        prompt: 'Can you add one more small activity tomorrow? Build gradually over the week.',
        example: 'Add a 5-minute breathing exercise after the walk.'
      }
    ]
  },

  cognitiveReframing: {
    id: 'cognitive_reframing',
    title: 'Cognitive Reframing',
    description: 'Challenge unhelpful thinking patterns and develop alternative perspectives.',
    steps: [
      {
        step: 1,
        label: 'Identify the Thought',
        prompt: 'What negative or unhelpful thought keeps coming up?',
        example: '"Nothing will ever get better."'
      },
      {
        step: 2,
        label: 'Identify the Thinking Pattern',
        prompt: 'Does this thought involve any of these patterns? All-or-nothing thinking, overgeneralizing, catastrophizing, mind reading, filtering out positives.',
        example: 'Overgeneralizing and catastrophizing.'
      },
      {
        step: 3,
        label: 'Challenge It',
        prompt: 'If a close friend said this thought to you, what would you say to them?',
        example: '"Things have improved before. This difficult phase will also pass."'
      },
      {
        step: 4,
        label: 'Reframe',
        prompt: 'Write a more realistic, balanced version of the original thought.',
        example: '"Things are very difficult right now. I have navigated difficult periods before and I can work through this too."'
      }
    ]
  },

  grounding545: {
    id: 'grounding_5_4_3_2_1',
    title: '5-4-3-2-1 Grounding Exercise',
    description: 'An evidence-based grounding technique to bring you back to the present moment during anxiety.',
    steps: [
      { step: 1, label: '5 Things You Can See', prompt: 'Look around and name 5 things you can see right now.', example: 'A window, a lamp, my phone, a glass of water, a chair.' },
      { step: 2, label: '4 Things You Can Touch', prompt: 'Name 4 things you can physically feel right now.', example: 'The chair beneath me, my feet on the floor, my shirt, the table surface.' },
      { step: 3, label: '3 Things You Can Hear', prompt: 'Listen carefully and name 3 sounds you can hear.', example: 'Traffic outside, a fan running, keyboard typing.' },
      { step: 4, label: '2 Things You Can Smell', prompt: 'Notice 2 things you can smell, or recall 2 calming scents.', example: 'Coffee, fresh air from the window.' },
      { step: 5, label: '1 Thing You Can Taste', prompt: 'Notice 1 thing you can taste right now.', example: 'A slight coffee taste from earlier.' }
    ]
  }
};

/**
 * Selects appropriate CBT exercises based on context.
 * @param {string} emotionalState - Current emotional state
 * @param {number} stressLevel - 1-10 stress level
 * @returns {Array} Recommended exercises
 */
export function selectCBTExercises(emotionalState = '', stressLevel = 5) {
  const state = emotionalState.toLowerCase();
  const exercises = [];

  // High acute anxiety → grounding first
  if (stressLevel >= 7 || state.includes('anxi') || state.includes('panic')) {
    exercises.push(CBT_EXERCISES.grounding545);
  }

  // Negative thought patterns → thought record or reframing
  if (state.includes('thought') || state.includes('believe') || state.includes('worth') || state.includes('fail')) {
    exercises.push(CBT_EXERCISES.cognitiveReframing);
    exercises.push(CBT_EXERCISES.thoughtRecord);
  }

  // Low mood / withdrawal → behavioral activation
  if (state.includes('unmotivated') || state.includes('low') || state.includes('sad') || state.includes('depressed')) {
    exercises.push(CBT_EXERCISES.behavioralActivation);
  }

  // Default if nothing matched
  if (exercises.length === 0) {
    exercises.push(CBT_EXERCISES.grounding545);
    exercises.push(CBT_EXERCISES.cognitiveReframing);
  }

  return exercises.slice(0, 2);
}
