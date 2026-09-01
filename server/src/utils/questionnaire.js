/**
 * Scoring helper for validated clinical wellness scales
 */

// WHO-5 Well-being Index
// Responses are scored 0-5. Total Raw Score is sum (0-25).
// Percentage well-being score is Raw Score * 4 (0-100%).
export const scoreWHO5 = (responses) => {
  if (!Array.isArray(responses) || responses.length !== 5) {
    return { rawScore: 0, percentageScore: 0 };
  }
  const rawScore = responses.reduce((sum, val) => sum + Math.min(5, Math.max(0, val)), 0);
  const percentageScore = rawScore * 4;
  return { rawScore, percentageScore };
};

// Perceived Stress Scale (PSS-10)
// Responses are scored 0-4.
// Reverse items: 4, 5, 7, 8 (indices 3, 4, 6, 7 in 0-indexed system)
// Reversing formula: 4 - response
export const scorePSS10 = (responses) => {
  if (!Array.isArray(responses) || responses.length !== 10) {
    return { totalScore: 0 };
  }
  const reverseIndices = [3, 4, 6, 7];
  const totalScore = responses.reduce((sum, val, index) => {
    const score = reverseIndices.includes(index) ? (4 - val) : val;
    return sum + Math.min(4, Math.max(0, score));
  }, 0);
  return { totalScore };
};

// GAD-7 (General Anxiety Screening)
// Responses are scored 0-3. Total sum: 0-21.
export const scoreGAD7 = (responses) => {
  if (!Array.isArray(responses) || responses.length !== 7) {
    return { totalScore: 0 };
  }
  const totalScore = responses.reduce((sum, val) => sum + Math.min(3, Math.max(0, val)), 0);
  return { totalScore };
};

// PHQ-9 (Depression Screening)
// Responses are scored 0-3. Total sum: 0-27.
export const scorePHQ9 = (responses) => {
  if (!Array.isArray(responses) || responses.length !== 9) {
    return { totalScore: 0 };
  }
  const totalScore = responses.reduce((sum, val) => sum + Math.min(3, Math.max(0, val)), 0);
  return { totalScore };
};
