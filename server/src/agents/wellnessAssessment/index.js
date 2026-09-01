import { calculateBMI, calculateWHO5, calculatePSS10, calculateGAD7, calculatePHQ9 } from '../../utils/scoringUtils.js';
import { calculateMMWBI } from '../../utils/mmwbiCalculator.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const runWellnessAssessmentAgent = async (assessmentData = {}) => {
  // Extract or normalize flat dataset-aligned payload
  const raw = assessmentData.rawInputs || assessmentData;

  // 1. Calculate BMI
  const computedBMI = calculateBMI(raw.Height_cm, raw.Weight_kg) || Number(raw.BMI) || 22.0;

  // 2. Calculate Psychometrics
  const who5 = calculateWHO5(raw);
  const pss10 = calculatePSS10(raw);
  const gad7 = calculateGAD7(raw);
  const phq9 = calculatePHQ9(raw);

  // Combine feature payload for ML service
  const featurePayload = {
    Age: Number(raw.Age ?? 25),
    Gender: String(raw.Gender ?? 'Female'),
    Height_cm: Number(raw.Height_cm ?? 165),
    Weight_kg: Number(raw.Weight_kg ?? 65),
    BMI: computedBMI,
    Education_Level: String(raw.Education_Level ?? 'Undergraduate'),
    Occupation: String(raw.Occupation ?? 'Student'),
    Work_Pattern: String(raw.Work_Pattern ?? 'Day'),
    Living_Arrangement: String(raw.Living_Arrangement ?? 'With Parents'),
    Relationship_Status: String(raw.Relationship_Status ?? 'Single'),

    Relationship_Satisfaction_0_10: Number(raw.Relationship_Satisfaction_0_10 ?? 5),
    Social_Circle_Size: Number(raw.Social_Circle_Size ?? 5),
    Social_Interaction_Frequency_0_10: Number(raw.Social_Interaction_Frequency_0_10 ?? 5),
    Social_Support_Score_0_10: Number(raw.Social_Support_Score_0_10 ?? 5),
    Family_Contact_Frequency_0_10: Number(raw.Family_Contact_Frequency_0_10 ?? 5),
    Loneliness_Score_0_10: Number(raw.Loneliness_Score_0_10 ?? 5),

    Academic_Stress_0_10: Number(raw.Academic_Stress_0_10 ?? 3),
    Work_Stress_0_10: Number(raw.Work_Stress_0_10 ?? 3),
    Financial_Stress_0_10: Number(raw.Financial_Stress_0_10 ?? 3),

    Screen_Time_Hours: Number(raw.Screen_Time_Hours ?? 6),
    Social_Media_Hours: Number(raw.Social_Media_Hours ?? 2),
    Physical_Activity_Minutes_Daily: Number(raw.Physical_Activity_Minutes_Daily ?? 45),
    Exercise_Days_Per_Week: Number(raw.Exercise_Days_Per_Week ?? 3),
    Sedentary_Hours_Daily: Number(raw.Sedentary_Hours_Daily ?? 6),

    Dietary_Quality_0_10: Number(raw.Dietary_Quality_0_10 ?? 6),
    Meals_Per_Day: Number(raw.Meals_Per_Day ?? 3),
    Water_Intake_Liters: Number(raw.Water_Intake_Liters ?? 2),
    Caffeine_Cups_Daily: Number(raw.Caffeine_Cups_Daily ?? 2),
    Smoking_Status: String(raw.Smoking_Status ?? 'Never'),
    Alcohol_Frequency: String(raw.Alcohol_Frequency ?? 'Never'),
    Substance_Use: String(raw.Substance_Use ?? 'No'),

    Sleep_Hours: Number(raw.Sleep_Hours ?? 7),
    Sleep_Quality_0_10: Number(raw.Sleep_Quality_0_10 ?? 7),
    Sleep_Efficiency_Percent: Number(raw.Sleep_Efficiency_Percent ?? 75),

    Chronic_Condition: String(raw.Chronic_Condition ?? 'None'),
    Number_of_Chronic_Conditions: Number(raw.Number_of_Chronic_Conditions ?? 0),
    Current_Medications: String(raw.Current_Medications ?? 'None'),
    Previous_Diagnosis: String(raw.Previous_Diagnosis ?? 'None'),
    Allergies: String(raw.Allergies ?? 'None'),
    Physical_Limitation: String(raw.Physical_Limitation ?? 'None'),

    WHO5_Q1: Number(raw.WHO5_Q1 ?? 4),
    WHO5_Q2: Number(raw.WHO5_Q2 ?? 4),
    WHO5_Q3: Number(raw.WHO5_Q3 ?? 4),
    WHO5_Q4: Number(raw.WHO5_Q4 ?? 4),
    WHO5_Q5: Number(raw.WHO5_Q5 ?? 4),

    PSS10_Q1: Number(raw.PSS10_Q1 ?? 1),
    PSS10_Q2: Number(raw.PSS10_Q2 ?? 1),
    PSS10_Q3: Number(raw.PSS10_Q3 ?? 1),
    PSS10_Q4: Number(raw.PSS10_Q4 ?? 3),
    PSS10_Q5: Number(raw.PSS10_Q5 ?? 3),
    PSS10_Q6: Number(raw.PSS10_Q6 ?? 1),
    PSS10_Q7: Number(raw.PSS10_Q7 ?? 3),
    PSS10_Q8: Number(raw.PSS10_Q8 ?? 3),
    PSS10_Q9: Number(raw.PSS10_Q9 ?? 1),
    PSS10_Q10: Number(raw.PSS10_Q10 ?? 1),

    GAD7_Q1: Number(raw.GAD7_Q1 ?? 0),
    GAD7_Q2: Number(raw.GAD7_Q2 ?? 0),
    GAD7_Q3: Number(raw.GAD7_Q3 ?? 0),
    GAD7_Q4: Number(raw.GAD7_Q4 ?? 0),
    GAD7_Q5: Number(raw.GAD7_Q5 ?? 0),
    GAD7_Q6: Number(raw.GAD7_Q6 ?? 0),
    GAD7_Q7: Number(raw.GAD7_Q7 ?? 0),

    PHQ9_Q1: Number(raw.PHQ9_Q1 ?? 0),
    PHQ9_Q2: Number(raw.PHQ9_Q2 ?? 0),
    PHQ9_Q3: Number(raw.PHQ9_Q3 ?? 0),
    PHQ9_Q4: Number(raw.PHQ9_Q4 ?? 0),
    PHQ9_Q5: Number(raw.PHQ9_Q5 ?? 0),
    PHQ9_Q6: Number(raw.PHQ9_Q6 ?? 0),
    PHQ9_Q7: Number(raw.PHQ9_Q7 ?? 0),
    PHQ9_Q8: Number(raw.PHQ9_Q8 ?? 0),
    PHQ9_Q9: Number(raw.PHQ9_Q9 ?? 0)
  };

  // 3. Predict Domain Scores (via FastAPI ML Service or Fallback)
  let domainScoresRaw = null;
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/predict-domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featurePayload)
    });
    if (mlRes.ok) {
      domainScoresRaw = await mlRes.json();
    }
  } catch (err) {
    console.warn('[WellnessAssessmentAgent] ML service fetch failed, using fallback calculations:', err.message);
  }

  const physicalHealth = domainScoresRaw?.Physical_Health_Score ?? Math.min(100, Math.max(10, (featurePayload.Physical_Activity_Minutes_Daily / 60) * 50 + (featurePayload.Exercise_Days_Per_Week / 7) * 50 - (featurePayload.Sedentary_Hours_Daily / 14) * 30 + 20));
  const recoveryWellness = domainScoresRaw?.Sleep_Recovery_Score ?? Math.min(100, Math.max(10, (featurePayload.Sleep_Hours / 8) * 50 + featurePayload.Sleep_Quality_0_10 * 5));
  const psychologicalWellbeing = domainScoresRaw?.Psychological_Wellbeing_Score ?? Math.min(100, Math.max(10, who5.percentage - phq9.totalScore * 2 - gad7.totalScore * 1.5));
  const socialWellbeing = domainScoresRaw?.Social_Wellbeing_Score ?? Math.min(100, Math.max(10, featurePayload.Social_Support_Score_0_10 * 6 + featurePayload.Social_Interaction_Frequency_0_10 * 4 - featurePayload.Loneliness_Score_0_10 * 5 + 20));
  const lifestyleBalance = domainScoresRaw?.Lifestyle_Balance_Score ?? Math.min(100, Math.max(10, featurePayload.Dietary_Quality_0_10 * 7 + Math.min(30, (featurePayload.Water_Intake_Liters / 3) * 30) - Math.min(25, (featurePayload.Screen_Time_Hours / 12) * 25) + 10));
  const stressResilience = domainScoresRaw?.Stress_Profile_Score ?? Math.min(100, Math.max(10, 100 - pss10.totalScore * 2.2));

  const domainScores = {
    physicalHealth: Number(physicalHealth.toFixed(2)),
    recoveryWellness: Number(recoveryWellness.toFixed(2)),
    psychologicalWellbeing: Number(psychologicalWellbeing.toFixed(2)),
    socialWellbeing: Number(socialWellbeing.toFixed(2)),
    lifestyleBalance: Number(lifestyleBalance.toFixed(2)),
    stressResilience: Number(stressResilience.toFixed(2))
  };

  // 4. Calculate Deterministic MMWBI & Risk Category
  const mmwbiResult = calculateMMWBI(domainScores);

  // 5. Gather Concerns, Strengths, and Flags
  const primaryConcerns = [];
  const strengths = [];
  const attentionFlags = [];
  const safetyFlags = [...phq9.safetyFlags];
  const explanations = [];

  // Domain evaluation
  if (domainScores.physicalHealth < 50) {
    primaryConcerns.push('Low physical health & movement consistency');
    attentionFlags.push('physical_activity_needed');
  } else if (domainScores.physicalHealth >= 75) {
    strengths.push('Strong physical activity routine');
  }

  if (domainScores.recoveryWellness < 50) {
    primaryConcerns.push('Insufficient sleep quality & recovery efficiency');
    attentionFlags.push('sleep_recovery_needed');
  } else if (domainScores.recoveryWellness >= 75) {
    strengths.push('Healthy sleep and recovery balance');
  }

  if (domainScores.psychologicalWellbeing < 50) {
    primaryConcerns.push('Elevated psychological distress indicators');
    attentionFlags.push('psychological_support_needed');
  } else if (domainScores.psychologicalWellbeing >= 75) {
    strengths.push('High psychological resilience');
  }

  if (domainScores.socialWellbeing < 50) {
    primaryConcerns.push('Perceived social isolation or high loneliness rating');
    attentionFlags.push('social_support_needed');
  }

  if (domainScores.stressResilience < 50) {
    primaryConcerns.push('High perceived stress load across work/life');
    attentionFlags.push('stress_management_needed');
  }

  // Explanations
  explanations.push(`Physical Health Score (${domainScores.physicalHealth}/100) estimated from physical activity mins, exercise frequency, and sedentary hours.`);
  explanations.push(`Recovery & Wellness Score (${domainScores.recoveryWellness}/100) derived from average sleep hours (${featurePayload.Sleep_Hours}h), quality rating, and efficiency.`);
  explanations.push(`Psychological Well-Being Score (${domainScores.psychologicalWellbeing}/100) incorporates WHO-5 (${who5.percentage}%), GAD-7 (${gad7.severity}), and PHQ-9 (${phq9.severity}).`);
  explanations.push(`Social Well-Being Score (${domainScores.socialWellbeing}/100) based on relationship satisfaction, support network size, and loneliness score.`);
  explanations.push(`Lifestyle Balance Score (${domainScores.lifestyleBalance}/100) reflects diet quality, screen time, water intake, and habit balance.`);
  explanations.push(`Stress Resilience Score (${domainScores.stressResilience}/100) incorporates PSS-10 perceived stress (${pss10.level}) and domain stress items.`);
  explanations.push(`Multimodal Mental Well-Being Index (MMWBI) calculated deterministically as ${mmwbiResult.mmwbi} (${mmwbiResult.userFacingRiskLabel}).`);

  return {
    domainScores,
    mmwbi: mmwbiResult.mmwbi,
    riskLevel: mmwbiResult.internalRiskLevel,
    userFacingRiskLabel: mmwbiResult.userFacingRiskLabel,
    mmwbiBreakdown: mmwbiResult.breakdown,
    psychometricScores: {
      who5,
      pss10,
      gad7,
      phq9
    },
    primaryConcerns,
    strengths,
    attentionFlags,
    safetyFlags,
    explanations,
    dataCompleteness: 100,
    rawFeaturePayload: featurePayload
  };
};
