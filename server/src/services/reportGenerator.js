/**
 * AarogyaMitra — Personalization Report Generator
 * Supports dual-mode personalization:
 * 1. AI-Driven Personalization (Google Gemini API when GEMINI_API_KEY is present in .env)
 * 2. Deterministic Deep Personalization Engine (Personalized fallback using User name, Age, Occupation, Work Pattern, Sleep & Psychometrics)
 */

export const generateWellnessReport = async (wellnessResult, psychometric, lifestyle, medical, profile, user = {}, rawPayload = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const firstName = user?.firstName || profile?.firstName || 'User';
  const age = profile?.age || rawPayload?.Age || 'not specified';
  const gender = profile?.gender || rawPayload?.Gender || 'not specified';
  const occupation = profile?.occupation || rawPayload?.Occupation || 'Student / Professional';
  const workPattern = profile?.workPattern || rawPayload?.Work_Pattern || 'Regular';

  // Attempt Gemini AI Generation if API key is provided
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const aiReport = await generateWithGeminiAPI({
        apiKey,
        firstName,
        age,
        gender,
        occupation,
        workPattern,
        wellnessResult,
        psychometric,
        lifestyle,
        medical,
        rawPayload
      });

      if (aiReport && aiReport.overallWellnessSummary) {
        return aiReport;
      }
    } catch (err) {
      console.warn('Gemini API report generation notice:', err.message, 'Falling back to Deep Personalization Engine.');
    }
  }

  // ── DEEP PERSONALIZATION ENGINE (Deterministic Fallback) ───────────────────
  
  // 1. Overall Wellness Summary
  const score = wellnessResult.overallWellBeingScore || 50;
  const category = wellnessResult.wellnessCategory || 'Moderate Risk';
  const overallWellnessSummary = `Hello ${firstName}, your personalized multimodal assessment reveals an overall Multimodal Well-Being Index (MMWBI) score of ${score}/100, placing your current holistic status in the "${category}" band. As a ${age}-year-old ${gender.toLowerCase()} working as a ${occupation} (${workPattern} schedule), your daily routine, sleep metrics, and stress indicators directly influence this rating.`;

  // 2. Psychometric Assessment Summary
  let psychometricAssessmentSummary = `${firstName}, your psychometric evaluations provide a clear window into your current mental well-being and stress levels. `;
  if (psychometric) {
    const whoScore = psychometric.who5?.score !== undefined ? (psychometric.who5.score * 4) : (psychometric.who5?.rawScore ? psychometric.who5.rawScore * 4 : 'N/A');
    const pssScore = psychometric.pss10?.score !== undefined ? psychometric.pss10.score : (psychometric.pss10?.rawScore || 'N/A');
    const gadScore = psychometric.gad7?.score !== undefined ? psychometric.gad7.score : (psychometric.gad7?.rawScore || 'N/A');
    const phqScore = psychometric.phq9?.score !== undefined ? psychometric.phq9.score : (psychometric.phq9?.rawScore || 'N/A');

    const gadSev = psychometric.gad7?.severity || 'Mild';
    const phqSev = psychometric.phq9?.severity || 'Mild';

    psychometricAssessmentSummary += `Your WHO-5 Well-Being score is ${whoScore}%, indicating your current emotional vitality. Your Perceived Stress Scale (PSS-10) score is ${pssScore}/40. Anxiety screening (GAD-7) reflects a "${gadSev}" level (${gadScore}/21), while depression screening (PHQ-9) reflects a "${phqSev}" level (${phqScore}/27). These validated screening tools help tailor your recovery pathway but are supportive wellness indicators rather than clinical diagnoses.`;
  }

  // 3. Lifestyle and Behavioral Insights
  let lifestyleInsights = `${firstName}, your lifestyle patterns play a pivotal role in your daily energy and recovery. `;
  const sleepHours = rawPayload.Sleep_Duration_Hours || rawPayload.Average_Sleep_Hours || '6-7';
  const exerciseDays = lifestyle?.physicalActivity?.daysPerWeek || rawPayload.Exercise_Days_Per_Week || 0;
  const sittingHours = lifestyle?.sedentaryTime?.hoursSittingPerDay || rawPayload.Sedentary_Hours_Daily || 8;
  const screenTime = rawPayload.Screen_Time_Before_Bed_Hours || 1.5;

  lifestyleInsights += `You average ${sleepHours} hours of sleep per night, with approximately ${screenTime} hours of screen exposure before bedtime. Your physical activity includes ${exerciseDays} active days per week, balanced against ${sittingHours} hours of daily sedentary sitting. Given your ${occupation} demands, introducing targeted movement breaks every 90 minutes will help prevent physical fatigue.`;

  // 4. Personal Health Context
  let personalHealthContext = `Health Profile Context for ${firstName}: `;
  const chronic = medical?.chronicConditions || (rawPayload.Chronic_Condition !== 'None' ? [rawPayload.Chronic_Condition] : []);
  const limits = medical?.physicalLimitations || (rawPayload.Physical_Limitation !== 'None' ? [rawPayload.Physical_Limitation] : []);

  if (chronic.length > 0 && chronic[0] !== 'None') {
    personalHealthContext += `You noted the following health condition(s): [${chronic.join(', ')}]. `;
  } else {
    personalHealthContext += `No chronic medical conditions were reported. `;
  }

  if (limits.length > 0 && limits[0] !== 'None') {
    personalHealthContext += `Reported physical movement limitations: [${limits.join(', ')}]. All recommended exercise routines will be customized to ensure safety.`;
  } else {
    personalHealthContext += `No physical movement limitations reported, allowing full access to active physical routines.`;
  }

  // 5. Strengths
  const strengthsList = wellnessResult.strengths && wellnessResult.strengths.length > 0
    ? wellnessResult.strengths
    : ['Maintaining your baseline daily routine', 'Completing this proactive health assessment'];
  const strengths = `${firstName}, our analysis identified these key strengths supporting your resilience: ${strengthsList.join('; ')}.`;

  // 6. Areas Requiring Attention
  const concernsList = wellnessResult.primaryConcerns && wellnessResult.primaryConcerns.length > 0
    ? wellnessResult.primaryConcerns
    : ['Optimizing sleep consistency and reducing sedentary fatigue'];
  const areasRequiringAttention = `Based on your responses, ${firstName}, the primary focus areas requiring your attention are: ${concernsList.join('; ')}. Addressing these items will yield the highest return for your overall vitality.`;

  // 7. Key Contributing Factors
  const keyContributingFactors = `The main factors shaping your wellness score are your ${workPattern.toLowerCase()} work schedule as a ${occupation}, your average sleep duration of ${sleepHours}h, your perceived stress levels, and your sedentary sitting patterns.`;

  // 8. Recommended Next Step
  let recommendedNextStep = `${firstName}, `;
  if (score < 40 || category === 'Critical Risk') {
    recommendedNextStep += `it is recommended to navigate to the Professional Support Pathway for immediate guidance and health resources.`;
  } else if (score < 65) {
    recommendedNextStep += `it is recommended to engage with the Recovery and Wellness Agent and Psychological Support Agent to regularize sleep and reduce stress.`;
  } else {
    recommendedNextStep += `continue your positive habits and visit the Physical Activity and Recovery Agents to maintain high performance.`;
  }

  return {
    overallWellnessSummary,
    psychometricAssessmentSummary,
    lifestyleInsights,
    personalHealthContext,
    strengths,
    areasRequiringAttention,
    keyContributingFactors,
    recommendedNextStep
  };
};

/**
 * Helper to call Google Gemini API for free-form AI personalized report generation
 */
async function generateWithGeminiAPI({ apiKey, firstName, age, gender, occupation, workPattern, wellnessResult, psychometric, lifestyle, medical, rawPayload }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are AarogyaMitra's AI Wellness Specialist. Generate a deeply personalized, empathetic, supportive 8-part wellness assessment report for a user named "${firstName}".

USER CONTEXT:
- Name: ${firstName}
- Age: ${age}
- Gender: ${gender}
- Occupation: ${occupation} (${workPattern} schedule)
- MMWBI Score: ${wellnessResult.overallWellBeingScore}/100
- Category: ${wellnessResult.wellnessCategory}
- Sleep Duration: ${rawPayload.Sleep_Duration_Hours || 7} hours/night
- Screen Time Before Bed: ${rawPayload.Screen_Time_Before_Bed_Hours || 1} hours
- Exercise Days/Week: ${lifestyle?.physicalActivity?.daysPerWeek || 0} days
- Sedentary Hours/Day: ${lifestyle?.sedentaryTime?.hoursSittingPerDay || 8} hours
- Psychometrics: WHO-5 score ${psychometric?.who5?.score * 4}%, PSS-10 stress ${psychometric?.pss10?.score}/40, GAD-7 anxiety ${psychometric?.gad7?.severity}, PHQ-9 depression ${psychometric?.phq9?.severity}
- Chronic Conditions: ${medical?.chronicConditions?.join(', ') || 'None'}
- Physical Limitations: ${medical?.physicalLimitations?.join(', ') || 'None'}
- Primary Concerns: ${wellnessResult.primaryConcerns?.join(', ') || 'None'}
- Strengths: ${wellnessResult.strengths?.join(', ') || 'None'}

INSTRUCTIONS:
Address "${firstName}" directly in every section. Make it feel warm, professional, non-diagnostic, and highly tailored to their specific numbers, job, and lifestyle.

Return strictly valid JSON with these exact 8 keys:
{
  "overallWellnessSummary": "...",
  "psychometricAssessmentSummary": "...",
  "lifestyleInsights": "...",
  "personalHealthContext": "...",
  "strengths": "...",
  "areasRequiringAttention": "...",
  "keyContributingFactors": "...",
  "recommendedNextStep": "..."
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text returned from Gemini API');

  return JSON.parse(text);
}
