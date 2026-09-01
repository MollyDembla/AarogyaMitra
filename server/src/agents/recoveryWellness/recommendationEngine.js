/**
 * Recovery and Wellness Agent — Recommendation Engine
 * Generates personalized 4-category recommendations based on the Recovery Profile.
 * Rules are stored here; no hardcoding in UI components.
 */

// ── Sleep Hygiene Recommendation Rules ───────────────────────────────────────
function getSleepHygieneRecs(profile, context) {
  const recs = [];
  const raw = context.rawFeaturePayload || {};
  const dims = profile.dimensionScores;

  const screenTime = Number(raw.Screen_Time_Before_Bed_Hours ?? raw.Evening_Screen_Hours ?? 1);
  const sleepDuration = Number(raw.Sleep_Duration_Hours ?? 7.5);
  const caffeine = raw.Caffeine_After_2pm || Number(raw.Caffeine_Servings_After_2pm ?? 0) > 0;

  // Always recommend consistent schedule if circadian score is low
  if (dims.circadianRegularity < 70) {
    recs.push({
      title: 'Establish a Consistent Sleep Schedule',
      detail: 'Choose a fixed bedtime and wake-up time — even on weekends. A consistent schedule reinforces your body\'s natural sleep-wake rhythm and significantly improves sleep quality over 2–3 weeks.',
      priority: 'high'
    });
  }

  // Screen time recommendation
  if (screenTime >= 1.5) {
    recs.push({
      title: 'Reduce Evening Screen Exposure',
      detail: `You reported approximately ${screenTime}h of screen time before bed. Aim to dim or eliminate screens at least 60 minutes before your target bedtime. The blue-light reduction allows natural melatonin production to support sleep onset.`,
      priority: screenTime >= 2.5 ? 'high' : 'medium'
    });
  } else {
    recs.push({
      title: 'Maintain Low Evening Screen Time',
      detail: 'You are already managing screen time well. Continue limiting bright screens in the 60 minutes before bed to preserve your healthy sleep onset pattern.',
      priority: 'low'
    });
  }

  // Caffeine
  if (caffeine) {
    recs.push({
      title: 'Shift Caffeine Consumption to Morning Hours',
      detail: 'Caffeine has a half-life of approximately 5–6 hours. Consuming it after 2:00 PM can delay sleep onset and reduce sleep efficiency. Consider switching to herbal teas or warm water after midday.',
      priority: 'medium'
    });
  }

  // Short sleep duration
  if (sleepDuration < 7) {
    recs.push({
      title: 'Increase Sleep Opportunity',
      detail: `Your average sleep duration (${sleepDuration}h) is below the recommended 7–9 hours. Try moving your bedtime 15–30 minutes earlier each week until reaching your optimal duration. Avoid dramatic schedule changes.`,
      priority: 'high'
    });
  }

  // Sleep environment
  if (dims.sleepQuality < 65) {
    recs.push({
      title: 'Optimize Your Sleep Environment',
      detail: 'A cool (18–21°C), dark, and quiet bedroom environment significantly improves sleep continuity. Consider blackout curtains, white noise, or a comfortable room temperature adjustment.',
      priority: 'medium'
    });
  }

  // Wind-down routine
  recs.push({
    title: 'Create a 20-Minute Wind-Down Routine',
    detail: 'Signal your nervous system that sleep is approaching with a calming pre-sleep ritual: dim lighting, gentle stretching, light reading, or breathing exercises. Consistency of the routine matters more than its specific content.',
    priority: dims.sleepQuality < 60 ? 'high' : 'medium'
  });

  return recs;
}

// ── Recovery Guidance Rules ──────────────────────────────────────────────────
function getRecoveryGuidanceRecs(profile, context) {
  const recs = [];
  const raw = context.rawFeaturePayload || {};
  const dims = profile.dimensionScores;

  const activityMins = Number(raw.Physical_Activity_Minutes_Daily ?? 30);
  const sedentary = Number(raw.Sedentary_Hours_Daily ?? 6);

  // Physical activity recommendations
  if (activityMins < 20) {
    recs.push({
      title: 'Begin a Gentle Daily Movement Practice',
      detail: 'Even 15–20 minutes of light walking or gentle yoga daily can significantly improve sleep quality, energy levels, and recovery capacity. Start small and build gradually over 2–3 weeks.',
      priority: 'high'
    });
  } else if (activityMins >= 20 && activityMins < 30) {
    recs.push({
      title: 'Gradually Increase Daily Activity to 30+ Minutes',
      detail: 'You are already moving regularly — well done. Gradually extending your activity to 30+ minutes per day is associated with improved sleep onset, reduced daytime fatigue, and better stress recovery.',
      priority: 'medium'
    });
  } else {
    recs.push({
      title: 'Maintain Your Current Physical Activity Level',
      detail: 'Your physical activity level is supporting your recovery. Consider timing vigorous exercise earlier in the day (before 6:00 PM) if you experience sleep onset difficulties.',
      priority: 'low'
    });
  }

  // Sedentary breaks
  if (sedentary >= 8) {
    recs.push({
      title: 'Introduce Regular Movement Breaks',
      detail: `With approximately ${sedentary}h of sedentary time daily, building in short movement breaks every 60–90 minutes will meaningfully reduce fatigue. A 5-minute walk or standing stretch is sufficient to reset your energy and circulation.`,
      priority: 'high'
    });
  }

  // Recovery after activity
  if (dims.fatigueRecoveryAdequacy < 60) {
    recs.push({
      title: 'Build Structured Recovery Time Into Your Day',
      detail: 'Low fatigue recovery scores suggest your daily schedule may not allow adequate rest between demanding periods. Identify one 20–30 minute "recovery window" daily for light rest, gentle breathing, or quiet activity.',
      priority: 'high'
    });
  }

  recs.push({
    title: 'Monitor Your Energy Across the Day',
    detail: 'For one week, note your energy levels at morning, midday, and evening (1–10 scale). This self-monitoring often reveals patterns — such as consistent afternoon fatigue — that can guide targeted adjustments.',
    priority: 'low'
  });

  return recs;
}

// ── Stress-Recovery Management Rules ────────────────────────────────────────
function getStressManagementRecs(profile, context) {
  const recs = [];
  const psych = context.psychometricScores || {};
  const dims = profile.dimensionScores;

  const pssRaw = Number(psych.pss10?.rawScore ?? psych.pss10?.total ?? null);
  const gad7Sev = psych.gad7?.severity ?? 'None';

  if (dims.stressRecoveryBalance < 50 || (!isNaN(pssRaw) && pssRaw > 20)) {
    recs.push({
      title: 'Practice Daily Stress Deactivation',
      detail: 'High stress is directly disrupting your recovery. A single 10–15 minute deactivation practice per day (breathing exercise, progressive muscle relaxation, or mindful walking) significantly reduces the physiological stress burden over 2–3 weeks.',
      priority: 'high'
    });
  }

  recs.push({
    title: 'Apply the 90-Second Rule for Stress Moments',
    detail: 'When a stressful moment arises, pause for 90 seconds of slow diaphragmatic breathing (4 counts in, hold 4, out 6). This brief practice interrupts the stress response cycle and prevents stress from accumulating into fatigue.',
    priority: 'medium'
  });

  if (gad7Sev === 'Moderate' || gad7Sev === 'Severe') {
    recs.push({
      title: 'Consider Professional Support for Anxiety Management',
      detail: 'Your responses suggest anxiety may be playing a significant role in your recovery difficulties. A mental health professional can provide personalized, evidence-based support. This recommendation is supportive guidance only.',
      priority: 'high',
      isSafetyRecommendation: true
    });
  }

  recs.push({
    title: 'Schedule a Weekly "Stress Inventory" Check-In',
    detail: 'Once a week, take 10 minutes to identify your three main stressors. Simply naming stress sources reduces their cognitive load and allows you to prioritize recovery-supportive actions more intentionally.',
    priority: 'low'
  });

  recs.push({
    title: 'Protect At Least One "Restorative Activity" Per Day',
    detail: 'Identify one activity that genuinely restores you (a walk in nature, reading, creative hobby, connecting with a friend) and protect 20–30 minutes for it daily. Restorative activities are a critical counterbalance to daily stress load.',
    priority: 'medium'
  });

  return recs;
}

// ── AYUSH-Informed Wellness Guidance Rules ───────────────────────────────────
function getAYUSHWellnessRecs(profile, context) {
  const dims = profile.dimensionScores;
  const raw = context.rawFeaturePayload || {};
  const recs = [];

  // Dinacharya (daily routine alignment)
  recs.push({
    title: 'Align With a Dinacharya-Inspired Daily Rhythm',
    detail: 'AYUSH wellness traditions emphasize Dinacharya — a structured daily routine aligned with natural rhythms. A consistent wake time, light morning practice, regular meal times, and an evening wind-down support circadian balance and metabolic recovery. These are general lifestyle recommendations, not medical prescriptions.',
    category: 'Daily Routine'
  });

  // Anulom Vilom Pranayama for sleep/stress
  if (dims.stressRecoveryBalance < 65 || dims.sleepQuality < 65) {
    recs.push({
      title: 'Anulom Vilom (Alternate Nostril Breathing)',
      detail: 'This traditional Pranayama technique — alternating breath between nostrils for 5–10 minutes — is associated with calming the nervous system and supporting better sleep onset. Best practiced in a quiet setting, 30–60 minutes before bedtime.',
      category: 'Pranayama'
    });
  }

  // Ashwagandha mention (general wellness)
  recs.push({
    title: 'General Adaptogenic Awareness',
    detail: 'AYUSH traditions include herbs such as Ashwagandha (Withania somnifera) as general wellness adaptogens traditionally associated with resilience and recovery support. This is general wellness information only — always consult a qualified AYUSH practitioner or healthcare professional before using any herbal supplement.',
    category: 'AYUSH Herbs'
  });

  // Golden milk / warm milk tradition
  if (dims.sleepQuality < 65) {
    recs.push({
      title: 'Warm Turmeric Milk (Haldi Doodh) Before Bed',
      detail: 'A traditional AYUSH bedtime preparation: warm milk with a small amount of turmeric and black pepper is used in traditional practice to support sleep and recovery. This is a cultural wellness practice — not a medical treatment. Ensure any milk alternatives suit your dietary needs.',
      category: 'Traditional Practice'
    });
  }

  // Yoga Nidra for deep rest
  if (dims.fatigueRecoveryAdequacy < 65) {
    recs.push({
      title: 'Yoga Nidra for Deep Recovery',
      detail: 'Yoga Nidra (yogic sleep) is a guided practice that leads the practitioner into a deeply restful state between wakefulness and sleep. A 20–30 minute session is traditionally considered deeply restorative. Many free guided sessions are available online.',
      category: 'Yoga Practice'
    });
  }

  // Savasana
  recs.push({
    title: 'Savasana (Corpse Pose) for Daily Recovery',
    detail: 'Lying flat on your back for 10–15 minutes with conscious relaxation of all muscle groups (Savasana) is one of the most accessible recovery practices from the yoga tradition. It can be practiced at any time of day and requires no equipment.',
    category: 'Yoga Practice'
  });

  return recs;
}

// ── Follow-up Monitoring Questions ──────────────────────────────────────────
function generateFollowUpQuestions(profile) {
  const dims = profile.dimensionScores;
  const questions = [];

  if (dims.sleepQuality < 65) {
    questions.push('How would you rate your sleep quality over the past week compared to before? (1 = much worse, 5 = much better)');
    questions.push('Are you still experiencing difficulty falling asleep or staying asleep?');
  }
  if (dims.stressRecoveryBalance < 60) {
    questions.push('Have you been able to practice any relaxation or stress-management technique this week?');
    questions.push('How is your overall stress level right now compared to when you started? (1 = much higher, 5 = much lower)');
  }
  if (dims.fatigueRecoveryAdequacy < 60) {
    questions.push('How would you rate your daytime energy levels this week? (1 = very low, 5 = very high)');
    questions.push('Have you been able to take regular movement breaks or exercise this week?');
  }
  questions.push('Overall, how are you feeling compared to when you completed the initial assessment? (1 = much worse, 5 = much better)');

  return questions;
}

// ── MASTER: Generate All 4-Category Recommendations ─────────────────────────
export function generateRecommendations(profile, context) {
  return {
    sleepHygiene: getSleepHygieneRecs(profile, context),
    recoveryGuidance: getRecoveryGuidanceRecs(profile, context),
    stressManagement: getStressManagementRecs(profile, context),
    ayushWellnessGuidance: getAYUSHWellnessRecs(profile, context),
    followUpQuestions: generateFollowUpQuestions(profile)
  };
}
