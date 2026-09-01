/**
 * Professional Type Routing Rules — Deterministic.
 * Determines which type of professional is most appropriate.
 * NEVER routes serious psychiatric concerns to AYUSH alone.
 */
import { CARE_LEVELS } from './careRules.js';

export const PROFESSIONAL_TYPES = {
  PSYCHOLOGIST: 'Psychologist',
  PSYCHIATRIST: 'Psychiatrist',
  PHYSICIAN: 'Physician',
  COUNSELOR: 'Counselor',
  AYUSH: 'AYUSH Professional'
};

/**
 * Determines the recommended professional type.
 * @param {object} context
 * @param {number} careLevel
 * @returns {{ primaryType, alternativeType, reasoning }}
 */
export function determineProfessionalType(context = {}, careLevel) {
  const { psychometricScores = {}, domainScores = {}, primaryConcerns = [], userPreference } = context;

  const phqScore = psychometricScores?.phq9?.score ?? 0;
  const gadScore = psychometricScores?.gad7?.score ?? 0;
  const physicalHealthScore = domainScores?.physicalHealth ?? 100;

  // ── Crisis / Urgent → Psychiatrist or Physician ────────────────────────
  if (careLevel >= CARE_LEVELS.URGENT_SUPPORT) {
    // Severe depression or anxiety with functional impairment → Psychiatrist
    if (phqScore >= 15 || gadScore >= 15) {
      return {
        primaryType: PROFESSIONAL_TYPES.PSYCHIATRIST,
        alternativeType: PROFESSIONAL_TYPES.PSYCHOLOGIST,
        reasoning: 'The severity and complexity of the psychological indicators suggest that a comprehensive psychiatric evaluation would be most appropriate. A psychiatrist can conduct a thorough assessment and coordinate care with other professionals.',
        description: {
          [PROFESSIONAL_TYPES.PSYCHIATRIST]: 'A medical doctor specializing in mental health who can conduct comprehensive evaluations for complex or severe mental health conditions.',
          [PROFESSIONAL_TYPES.PSYCHOLOGIST]: 'A licensed professional trained in psychological assessment and structured therapeutic interventions.'
        }
      };
    }
  }

  // ── Physical health concern → Physician ───────────────────────────────
  const hasPhysicalConcern = primaryConcerns.some(c =>
    c.toLowerCase().includes('physical') || c.toLowerCase().includes('medical') || c.toLowerCase().includes('pain')
  );
  if (physicalHealthScore < 50 || hasPhysicalConcern) {
    return {
      primaryType: PROFESSIONAL_TYPES.PHYSICIAN,
      alternativeType: PROFESSIONAL_TYPES.PSYCHOLOGIST,
      reasoning: 'Physical health indicators and reported concerns suggest that a physician evaluation may be beneficial to rule out any underlying medical contributors to your wellness profile.',
      description: {
        [PROFESSIONAL_TYPES.PHYSICIAN]: 'A general physician who can assess physical health, rule out medical contributors to psychological symptoms, and coordinate referrals.',
        [PROFESSIONAL_TYPES.PSYCHOLOGIST]: 'Can provide psychological support in parallel with medical care.'
      }
    };
  }

  // ── Moderate-Severe Psychological → Psychologist ─────────────────────
  if (phqScore >= 10 || gadScore >= 10 || careLevel >= CARE_LEVELS.PROFESSIONAL_RECOMMENDED) {
    return {
      primaryType: PROFESSIONAL_TYPES.PSYCHOLOGIST,
      alternativeType: userPreference === 'ayush' ? PROFESSIONAL_TYPES.AYUSH : PROFESSIONAL_TYPES.COUNSELOR,
      reasoning: 'Your emotional wellness indicators and stress levels suggest that structured psychological support from a qualified psychologist would be beneficial. A psychologist can provide evidence-based therapeutic interventions tailored to your needs.',
      description: {
        [PROFESSIONAL_TYPES.PSYCHOLOGIST]: 'A licensed professional trained in psychological assessment and evidence-based therapies (CBT, DBT, and others) for emotional and behavioral concerns.',
        [PROFESSIONAL_TYPES.COUNSELOR]: 'A counselor can provide supportive talk therapy and coping skill development for general life stressors.'
      }
    };
  }

  // ── Mild → Counselor or AYUSH ─────────────────────────────────────────
  if (userPreference === 'ayush') {
    return {
      primaryType: PROFESSIONAL_TYPES.AYUSH,
      alternativeType: PROFESSIONAL_TYPES.COUNSELOR,
      reasoning: 'Based on your wellness profile and preferences, AYUSH-oriented wellness guidance may complement your overall wellness journey for general lifestyle and stress management.',
      description: {
        [PROFESSIONAL_TYPES.AYUSH]: 'An AYUSH professional (Ayurveda, Yoga, Unani, Siddha, Homeopathy) can provide complementary wellness and lifestyle guidance. Note: AYUSH care should complement, not replace, evidence-based mental health care for significant concerns.',
        [PROFESSIONAL_TYPES.COUNSELOR]: 'A counselor can provide supportive guidance for general stress and lifestyle concerns.'
      }
    };
  }

  return {
    primaryType: PROFESSIONAL_TYPES.COUNSELOR,
    alternativeType: PROFESSIONAL_TYPES.AYUSH,
    reasoning: 'Your current wellness profile indicates mild concerns that may benefit from supportive counseling to build coping skills and maintain long-term wellbeing.',
    description: {
      [PROFESSIONAL_TYPES.COUNSELOR]: 'A counselor can provide supportive talk therapy, stress management, and coping skill development.',
      [PROFESSIONAL_TYPES.AYUSH]: 'An AYUSH professional can provide complementary lifestyle and wellness guidance.'
    }
  };
}
