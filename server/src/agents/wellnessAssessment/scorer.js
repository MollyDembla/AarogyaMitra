/**
 * Configurable scoring rules and coefficients
 */
export const SCORING_WEIGHTS = {
  psychological: 0.40, // 40% weight
  lifestyle: 0.25,     // 25% weight
  physical: 0.20,      // 20% weight
  medical: 0.15        // 15% weight
};

export const calculateDomainScores = (psychometric, lifestyle, medical) => {
  // Psychological Domain: WHO-5, PSS-10, GAD-7, PHQ-9
  let psychScore = 70; // baseline
  if (psychometric) {
    const who5Percentage = psychometric.who5?.score ? (psychometric.who5.score * 4) : 70; // WHO-5 raw is out of 25. Percentage is score * 4.
    const pss10Inverse = psychometric.pss10?.score !== undefined ? (40 - psychometric.pss10.score) * 2.5 : 70; // PSS is 0-40, high is bad
    const gad7Inverse = psychometric.gad7?.score !== undefined ? (21 - psychometric.gad7.score) * (100 / 21) : 70; // GAD is 0-21, high is bad
    const phq9Inverse = psychometric.phq9?.score !== undefined ? (27 - psychometric.phq9.score) * (100 / 27) : 70; // PHQ is 0-27, high is bad
    
    psychScore = (who5Percentage + pss10Inverse + gad7Inverse + phq9Inverse) / 4;
  }

  // Lifestyle Domain: Active days, screen hours, sedentary time, food quality
  let lifestyleScore = 60;
  if (lifestyle) {
    const activityPoints = (lifestyle.physicalActivity?.daysPerWeek || 0) * (100 / 7);
    const sedentaryPenalty = (lifestyle.sedentaryTime?.hoursSittingPerDay || 8) * 4; // up to 16h sitting is -64 points
    const sedentaryPoints = Math.max(0, 100 - sedentaryPenalty);
    
    let dietPoints = 50;
    const qualityWeights = { 'Poor': 20, 'Fair': 50, 'Good': 85, 'Excellent': 100 };
    if (lifestyle.dietaryHabits) {
      dietPoints = qualityWeights[lifestyle.dietaryHabits.generalDietQuality] || 50;
    }
    
    lifestyleScore = (activityPoints + sedentaryPoints + dietPoints) / 3;
  }

  // Physical Activity Domain
  let physicalScore = 50;
  if (lifestyle && lifestyle.physicalActivity) {
    const days = lifestyle.physicalActivity.daysPerWeek || 0;
    const mins = lifestyle.physicalActivity.avgDurationMinutes || 0;
    physicalScore = Math.min(100, (days * 12) + (mins / 2));
  }

  // Medical Domain: penalize for limitations or condition load
  let medicalScore = 90;
  if (medical) {
    const conditionPenalty = (medical.chronicConditions?.length || 0) * 15;
    const limitPenalty = (medical.physicalLimitations?.length || 0) * 20;
    medicalScore = Math.max(10, 100 - conditionPenalty - limitPenalty);
  }

  return {
    psychological: Math.round(psychScore),
    lifestyle: Math.round(lifestyleScore),
    physicalActivity: Math.round(physicalScore),
    medicalContext: Math.round(medicalScore)
  };
};

export const evaluateWellBeing = (domainScores) => {
  const overall = (
    domainScores.psychological * SCORING_WEIGHTS.psychological +
    domainScores.lifestyle * SCORING_WEIGHTS.lifestyle +
    domainScores.physicalActivity * SCORING_WEIGHTS.physical +
    domainScores.medicalContext * SCORING_WEIGHTS.medical
  );

  const roundedOverall = Math.round(overall);

  let category = 'Moderate';
  if (roundedOverall >= 80) category = 'Excellent';
  else if (roundedOverall >= 65) category = 'Good';
  else if (roundedOverall >= 45) category = 'Moderate';
  else if (roundedOverall >= 25) category = 'Low';
  else category = 'Needs Attention';

  return {
    overallWellBeingScore: roundedOverall,
    wellnessCategory: category
  };
};
