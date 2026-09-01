/**
 * Scoring Utilities for AarogyaMitra
 * Validated instrument scoring algorithms for WHO-5, PSS-10, GAD-7, PHQ-9, and BMI calculation.
 */

/**
 * Calculate Body Mass Index (BMI)
 * @param {number} heightCm - Height in centimeters
 * @param {number} weightKg - Weight in kilograms
 * @returns {number} BMI rounded to 2 decimal places
 */
export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(2));
}

/**
 * Calculate WHO-5 Well-Being Index
 * Items Q1..Q5 rated 0-5.
 * @param {Object} responses - Object containing WHO5_Q1..WHO5_Q5
 * @returns {Object} { rawScore, percentage }
 */
export function calculateWHO5(responses = {}) {
  const items = [
    Number(responses.WHO5_Q1 ?? 0),
    Number(responses.WHO5_Q2 ?? 0),
    Number(responses.WHO5_Q3 ?? 0),
    Number(responses.WHO5_Q4 ?? 0),
    Number(responses.WHO5_Q5 ?? 0)
  ];

  const rawScore = items.reduce((sum, val) => sum + Math.max(0, Math.min(5, val)), 0);
  const percentage = Number(((rawScore / 25) * 100).toFixed(2));

  return {
    rawScore,
    percentage
  };
}

/**
 * Calculate PSS-10 Perceived Stress Scale
 * Items Q1..Q10 rated 0-4.
 * Reverse scored items: Q4, Q5, Q7, Q8.
 * @param {Object} responses - Object containing PSS10_Q1..PSS10_Q10
 * @returns {Object} { totalScore, level }
 */
export function calculatePSS10(responses = {}) {
  const reverseItems = new Set([4, 5, 7, 8]);
  let totalScore = 0;

  for (let i = 1; i <= 10; i++) {
    const val = Math.max(0, Math.min(4, Number(responses[`PSS10_Q${i}`] ?? 0)));
    if (reverseItems.has(i)) {
      totalScore += (4 - val);
    } else {
      totalScore += val;
    }
  }

  let level = "Low";
  if (totalScore >= 27) {
    level = "High";
  } else if (totalScore >= 14) {
    level = "Moderate";
  }

  return {
    totalScore,
    level
  };
}

/**
 * Calculate GAD-7 Anxiety Scale
 * Items Q1..Q7 rated 0-3.
 * @param {Object} responses - Object containing GAD7_Q1..GAD7_Q7
 * @returns {Object} { totalScore, severity }
 */
export function calculateGAD7(responses = {}) {
  let totalScore = 0;
  for (let i = 1; i <= 7; i++) {
    const val = Math.max(0, Math.min(3, Number(responses[`GAD7_Q${i}`] ?? 0)));
    totalScore += val;
  }

  let severity = "Minimal";
  if (totalScore >= 15) {
    severity = "Severe";
  } else if (totalScore >= 10) {
    severity = "Moderate";
  } else if (totalScore >= 5) {
    severity = "Mild";
  }

  return {
    totalScore,
    severity
  };
}

/**
 * Calculate PHQ-9 Depression Scale & Safety Triggers
 * Items Q1..Q9 rated 0-3.
 * @param {Object} responses - Object containing PHQ9_Q1..PHQ9_Q9
 * @returns {Object} { totalScore, severity, safetyFlags }
 */
export function calculatePHQ9(responses = {}) {
  let totalScore = 0;
  const safetyFlags = [];

  for (let i = 1; i <= 9; i++) {
    const val = Math.max(0, Math.min(3, Number(responses[`PHQ9_Q${i}`] ?? 0)));
    totalScore += val;
  }

  const q9Val = Number(responses.PHQ9_Q9 ?? 0);
  if (q9Val > 0) {
    safetyFlags.push({
      type: "suicidal_ideation_risk",
      severity: q9Val >= 2 ? "CRITICAL" : "HIGH",
      message: "Positive response to self-harm or suicidal ideation item (PHQ-9 Q9)."
    });
  }

  let severity = "Minimal";
  if (totalScore >= 20) {
    severity = "Severe";
    safetyFlags.push({
      type: "severe_depression_crisis",
      severity: "CRITICAL",
      message: "Severe depression score threshold reached (PHQ-9 >= 20)."
    });
  } else if (totalScore >= 15) {
    severity = "Moderately Severe";
  } else if (totalScore >= 10) {
    severity = "Moderate";
  } else if (totalScore >= 5) {
    severity = "Mild";
  }

  return {
    totalScore,
    severity,
    safetyFlags
  };
}
