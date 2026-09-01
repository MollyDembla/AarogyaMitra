/**
 * Recovery and Wellness Agent — Routine Plan Engine
 * Generates an actionable routine improvement plan with major changes,
 * step-by-step execution schedule, and adapts dynamically to user exceptional conditions.
 */
import { env } from '../../config/env.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function generateRoutinePlan(profile, context, exceptionalConditions = '') {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const dims = profile.dimensionScores || {};
  const primaryConcern = profile.primaryConcern || 'General Fatigue & Recovery';
  const rwi = profile.rwi || profile.recoveryWellnessIndex || 60;
  const raw = context.rawFeaturePayload || {};
  const firstName = context.userName || context.firstName || 'there';

  let geminiPlan = null;
  if (apiKey && apiKey.trim().length > 10) {
    try {
      geminiPlan = await callGeminiForRoutinePlan({
        apiKey, firstName, rwi, primaryConcern, dims, raw, exceptionalConditions
      });
    } catch (err) {
      console.warn('Gemini Routine Plan API unavailable, using rule-based routine engine:', err.message);
    }
  }

  if (geminiPlan) {
    return geminiPlan;
  }

  // Adaptive Rule-Based Routine Improvement Plan
  return buildAdaptiveRuleBasedPlan(profile, context, exceptionalConditions);
}

function buildAdaptiveRuleBasedPlan(profile, context, exceptionalConditions = '') {
  const dims = profile.dimensionScores || {};
  const condText = exceptionalConditions.toLowerCase();
  const isLateNight = condText.includes('late night') || condText.includes('stay awake') || condText.includes('night shift') || condText.includes('sleep less') || condText.includes('cant get 8') || condText.includes('can\'t get 8');
  const isEarlyWake = condText.includes('early morning') || condText.includes('5 am') || condText.includes('commute');

  // Major Changes Needed
  const majorChanges = [];

  if (isLateNight) {
    majorChanges.push({
      title: 'Anchored Morning Wake-Up Time',
      rationale: 'Even when staying awake till late night (1:00 AM – 2:00 AM), anchor your morning wake-up time within a consistent 30-minute window (e.g., 7:30 AM). This prevents severe circadian misalignment.',
      impact: 'High Impact on Daytime Alertness'
    });
    majorChanges.push({
      title: 'Targeted 20-Minute Midday Power Nap Protocol',
      rationale: 'To compensate for reduced night sleep (5–6 hrs), schedule a 20-minute power nap between 1:30 PM and 2:30 PM. Set an alarm for 25 minutes max to avoid deep sleep inertia.',
      impact: 'Critical Energy Recovery'
    });
    majorChanges.push({
      title: 'Late-Night Digital Light Suppression',
      rationale: 'During late night work or study sessions, dim screen brightness to minimum and use warm night-shift mode or blue-light glasses to protect melatonin levels.',
      impact: 'Improves Sleep Efficiency'
    });
    majorChanges.push({
      title: 'Strict 2:00 PM Afternoon Caffeine Boundary',
      rationale: 'Consuming caffeine late in the evening compounds sleep fragmentation during short sleep windows. Switch to water or herbal teas after 2:00 PM.',
      impact: 'Enhances Deep Sleep Proportion'
    });
  } else if (isEarlyWake) {
    majorChanges.push({
      title: 'Earlier Evening Digital Sunset (10:00 PM)',
      rationale: 'To accommodate early morning wake-up schedules, begin your wind-down routine by 9:30 PM and turn off bright screens by 10:00 PM.',
      impact: 'Ensures Adequate Sleep Duration'
    });
    majorChanges.push({
      title: 'Immediate Morning Sunlight Exposure',
      rationale: 'Get 10 minutes of direct outdoor natural sunlight immediately after waking up to suppress melatonin and trigger cortisol awakening response.',
      impact: 'Boosts Early Alertness'
    });
  } else {
    majorChanges.push({
      title: 'Circadian Bedtime & Wake-Up Synchronization',
      rationale: 'Maintain a fixed 7.5 to 8-hour sleep window (e.g. 11:00 PM – 7:00 AM) to optimize REM and deep sleep architecture.',
      impact: 'Optimal Holistic Recovery'
    });
    majorChanges.push({
      title: '60-Minute Evening Buffer Zone',
      rationale: 'Dedicating 60 minutes before bed to non-screen relaxing activities (stretching, reading, warm bath) significantly lowers stress hormones.',
      impact: 'Reduces Sleep Latency'
    });
  }

  // Daily Execution Schedule
  const dailySchedule = [
    {
      timeframe: 'Morning (07:30 AM – 09:00 AM)',
      phase: 'Circadian Awakening & Hydration',
      actions: [
        'Drink 500ml water immediately upon waking up to rehydrate your system.',
        'Get 10 minutes of natural outdoor sunlight or bright light exposure.',
        'Perform 5 minutes of light stretching or movement to stimulate circulation.'
      ]
    },
    {
      timeframe: 'Afternoon (01:30 PM – 03:00 PM)',
      phase: isLateNight ? 'Restorative Power Nap & Energy Management' : 'Focus & Energy Reset',
      actions: isLateNight ? [
        'Take a 20-minute power nap (between 1:30 PM – 2:30 PM) to restore daytime cognitive alertness.',
        'Enforce a strict cutoff for caffeinated drinks at 2:00 PM.',
        'Take a 5-minute walking break to prevent afternoon sluggishness.'
      ] : [
        'Enforce a 2:00 PM caffeine cutoff.',
        'Take a 5-minute walking or stretching break every 60–90 minutes of sedentary work.',
        'Hydrate with water or herbal tea.'
      ]
    },
    {
      timeframe: 'Evening (06:30 PM – 09:30 PM)',
      phase: 'Stress Deactivation & Meal Timing',
      actions: [
        'Complete dinner at least 3 hours before your planned sleep time to allow metabolic digestion.',
        'Engage in 15–20 minutes of light restorative activity (walking, light reading, music).'
      ]
    },
    {
      timeframe: isLateNight ? 'Late Night & Wind-down (10:00 PM – 01:30 AM)' : 'Night Wind-down (10:00 PM – 11:00 PM)',
      phase: isLateNight ? 'Late Night Task Protocol & Pre-sleep Transition' : 'Sleep Preparation Routine',
      actions: isLateNight ? [
        'Set screens to warm night mode / blue-light filter during late work/studies.',
        'Take short 3-minute eye breaks every 45 minutes.',
        'Perform 5 minutes of slow diaphragmatic breathing immediately before going to bed at 1:30 AM.'
      ] : [
        'Turn off all electronic devices 45–60 minutes before bedtime.',
        'Dim bedroom lights and keep room temperature cool (18–20°C).',
        'Practice 5 minutes of deep abdominal breathing or progressive muscle relaxation.'
      ]
    }
  ];

  const executionGuidance = isLateNight
    ? `Since your routine requires staying awake till late night, this plan is specifically adapted to maximize sleep efficiency during short sleep windows and utilize a 20-minute afternoon power nap to prevent fatigue build-up.`
    : `This routine plan is designed to systematically restore your sleep architecture, balance daytime alertness, and optimize your overall Recovery and Wellness Index (RWI).`;

  return {
    adaptedForConditions: exceptionalConditions || 'Standard Daily Routine',
    majorChanges,
    dailySchedule,
    executionGuidance
  };
}

async function callGeminiForRoutinePlan({ apiKey, firstName, rwi, primaryConcern, dims, raw, exceptionalConditions }) {
  const prompt = `You are AarogyaMitra's Recovery and Wellness AI Agent.

Create an actionable, human-like Daily Routine Improvement Plan for ${firstName}.

USER CONTEXT:
- Recovery and Wellness Index (RWI): ${rwi}/100
- Primary Concern: ${primaryConcern}
- Exceptional Conditions / User Constraints: "${exceptionalConditions || 'None specified'}"

CRITICAL INSTRUCTIONS:
- DO NOT use markdown symbols or asterisks (**text**). Write clean, plain text.
- If the user specified an exceptional condition (e.g. "staying awake till late night so can't get 8 hrs sleep" or "night shift"), ADAPT THE PLAN SPECIFICALLY TO THEIR CONSTRAINT (e.g., incorporate a 20-min power nap, caffeine cutoff, shifted sleep windows, bright light protocol).
- Provide a structured JSON object in this exact format:
{
  "majorChanges": [
    { "title": "Change Title", "rationale": "Why & How", "impact": "Expected Benefit" }
  ],
  "dailySchedule": [
    { "timeframe": "Morning (07:30 AM - 09:00 AM)", "phase": "Awakening", "actions": ["Action 1", "Action 2"] }
  ],
  "executionGuidance": "Detailed summary on how to execute this routine given their constraints."
}`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    })
  });

  if (!response.ok) throw new Error(`Gemini Routine Plan Error: ${response.statusText}`);
  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    return {
      adaptedForConditions: exceptionalConditions || 'Standard Daily Routine',
      majorChanges: parsed.majorChanges || [],
      dailySchedule: parsed.dailySchedule || [],
      executionGuidance: parsed.executionGuidance || ''
    };
  }
  return null;
}
