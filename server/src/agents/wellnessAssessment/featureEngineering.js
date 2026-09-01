/**
 * Transforms raw assessment answers into a structured feature vector
 * Normalization maps variables to 0-1 or standard ranges
 */
export const preprocessInputs = (inputs) => {
  const features = {};

  // Demographics normalizations
  if (inputs.age) {
    features.ageNormalized = inputs.age / 100;
  }
  
  if (inputs.bmi) {
    features.bmiNormalized = inputs.bmi / 40; // normal range normalization
  }

  // Lifestyle indicators mapping
  if (inputs.physicalActivity) {
    const days = inputs.physicalActivity.daysPerWeek || 0;
    features.physicalActivityScore = days / 7;
  }

  if (inputs.sedentaryTime) {
    const hours = inputs.sedentaryTime.hoursSittingPerDay || 0;
    features.sedentaryScore = hours / 24;
  }

  if (inputs.dietaryHabits) {
    const quality = inputs.dietaryHabits.generalDietQuality || 'Fair';
    const qualityWeights = { 'Poor': 0.2, 'Fair': 0.5, 'Good': 0.8, 'Excellent': 1.0 };
    features.dietQualityScore = qualityWeights[quality] || 0.5;
  }

  return features;
};
