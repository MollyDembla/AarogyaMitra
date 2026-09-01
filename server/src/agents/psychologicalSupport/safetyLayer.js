/**
 * Psychological Safety Layer — Deterministic, Configurable, Rule-Based.
 * CRITICAL: No LLM can override these rules. Crisis detection is always deterministic.
 */

// ── RISK LEVEL DEFINITIONS ─────────────────────────────────────────────────
export const RISK_LEVELS = {
  NORMAL: 1,
  MODERATE_CONCERN: 2,
  HIGH_CONCERN: 3,
  CRISIS: 4
};

// ── CRISIS INDICATORS (Level 4) ────────────────────────────────────────────
// Any of these phrases in user input → immediate crisis pathway
const CRISIS_PHRASES = [
  'kill myself', 'end my life', 'want to die', 'suicide', 'suicidal',
  'don\'t want to live', 'not worth living', 'better off dead', 'end it all',
  'harm myself', 'hurt myself', 'self harm', 'cut myself', 'overdose',
  'no reason to live', 'everyone would be better without me',
  'going to hurt someone', 'harm someone else', 'kill someone'
];

// ── HIGH CONCERN INDICATORS (Level 3) ─────────────────────────────────────
const HIGH_CONCERN_PHRASES = [
  'hopeless', 'completely hopeless', 'no hope', 'can\'t go on',
  'can\'t take it anymore', 'extremely depressed', 'severe anxiety',
  'panic attack', 'can\'t function', 'unable to function',
  'breakdown', 'mental breakdown', 'losing my mind', 'losing control'
];

// ── MODERATE CONCERN INDICATORS (Level 2) ─────────────────────────────────
const MODERATE_CONCERN_PHRASES = [
  'very stressed', 'really anxious', 'feeling hopeless', 'feel worthless',
  'no point', 'exhausted', 'burned out', 'burned out', 'overwhelmed',
  'can\'t sleep', 'not eating', 'crying all day', 'very sad', 'deeply depressed'
];

/**
 * Evaluates the risk level of a user message.
 * Returns a structured safety assessment.
 * This function MUST be called before any LLM processing.
 *
 * @param {string} message - Raw user message text
 * @param {object} context - User wellness context (psychometricScores, mmwbi, etc.)
 * @returns {object} safetyAssessment
 */
export function evaluateSafety(message, context = {}) {
  const text = message.toLowerCase().trim();

  // ── Level 4: Crisis ───────────────────────────────────────────────────
  for (const phrase of CRISIS_PHRASES) {
    if (text.includes(phrase)) {
      return {
        riskLevel: RISK_LEVELS.CRISIS,
        riskLabel: 'crisis',
        triggered: phrase,
        requiresImmediateAction: true,
        allowNormalConversation: false,
        message: 'A crisis indicator was detected in your message.',
        crisisResources: getCrisisResources(),
        recommendation: 'Please reach out to a crisis helpline or emergency services immediately. You are not alone.'
      };
    }
  }

  // ── Level 3: High Concern ─────────────────────────────────────────────
  for (const phrase of HIGH_CONCERN_PHRASES) {
    if (text.includes(phrase)) {
      return {
        riskLevel: RISK_LEVELS.HIGH_CONCERN,
        riskLabel: 'high_concern',
        triggered: phrase,
        requiresImmediateAction: false,
        allowNormalConversation: false,
        showProfessionalSupport: true,
        message: 'Your message suggests significant distress.',
        recommendation: 'It may be beneficial to speak with a mental health professional. Would you like guidance on professional support?'
      };
    }
  }

  // ── Level 2: Moderate Concern ─────────────────────────────────────────
  // Also check psychometric scores for context elevation
  const gadScore = context?.psychometricScores?.gad7?.score;
  const phqScore = context?.psychometricScores?.phq9?.score;
  const pssScore = context?.psychometricScores?.pss10?.score;

  let scoreElevated = false;
  if (gadScore && gadScore >= 15) scoreElevated = true;  // Severe anxiety
  if (phqScore && phqScore >= 20) scoreElevated = true;  // Severe depression
  if (pssScore && pssScore >= 34) scoreElevated = true;  // Very high stress

  let moderateTriggered = null;
  for (const phrase of MODERATE_CONCERN_PHRASES) {
    if (text.includes(phrase)) {
      moderateTriggered = phrase;
      break;
    }
  }

  if (moderateTriggered || scoreElevated) {
    return {
      riskLevel: RISK_LEVELS.MODERATE_CONCERN,
      riskLabel: 'moderate_concern',
      triggered: moderateTriggered,
      scoreElevated,
      requiresImmediateAction: false,
      allowNormalConversation: true,
      showSupportSuggestion: true,
      message: 'Your message indicates elevated stress or emotional difficulty.',
      recommendation: 'I hear you. Let\'s work through this together with some supportive strategies.'
    };
  }

  // ── Level 1: Normal ───────────────────────────────────────────────────
  return {
    riskLevel: RISK_LEVELS.NORMAL,
    riskLabel: 'normal',
    requiresImmediateAction: false,
    allowNormalConversation: true
  };
}

/**
 * Verified crisis resource database — NOT LLM-generated.
 */
export function getCrisisResources() {
  return [
    {
      name: 'iCall (TISS)',
      contact: '9152987821',
      type: 'crisis',
      available: 'Mon–Sat, 8am–10pm',
      description: 'Psychosocial helpline run by Tata Institute of Social Sciences.',
      verified: true,
      verifiedDate: '2024-01'
    },
    {
      name: 'KIRAN National Mental Health Helpline',
      contact: '1800-599-0019',
      type: 'crisis',
      available: '24/7, Free',
      description: 'Government of India free mental health rehabilitation helpline.',
      verified: true,
      verifiedDate: '2024-01'
    },
    {
      name: 'Vandrevala Foundation',
      contact: '9999 666 555',
      type: 'crisis',
      available: '24/7',
      description: 'Mental health support and crisis intervention helpline.',
      verified: true,
      verifiedDate: '2024-01'
    },
    {
      name: 'Snehi',
      contact: '044-24640050',
      type: 'crisis',
      available: 'Daily, 8am–10pm',
      description: 'Emotional support and suicide prevention helpline.',
      verified: true,
      verifiedDate: '2024-01'
    },
    {
      name: 'Emergency Services',
      contact: '112',
      type: 'emergency',
      available: '24/7',
      description: 'National emergency helpline for immediate danger situations.',
      verified: true,
      verifiedDate: '2024-01'
    }
  ];
}
