import { evaluateSafety, RISK_LEVELS, getCrisisResources } from './safetyLayer.js';
import { selectCBTExercises } from './cbtExercises.js';
import { selectCopingStrategies, getJournalPrompts } from './copingStrategies.js';
import { env } from '../../config/env.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Full Psychological Support Agent.
 *
 * Pipeline:
 *   1. Deterministic safety evaluation (ALWAYS first — cannot be overridden)
 *   2. If crisis → return crisis resources immediately
 *   3. Build context from wellness data
 *   4. Generate empathetic reply (Gemini API → graceful fallback)
 *   5. Select coping strategies + CBT exercises
 *   6. Return structured output
 */
export const runPsychologicalSupportAgent = async (userMessage, context = {}, conversationHistory = []) => {

  // ── STEP 1: Safety Layer (ALWAYS first, deterministic) ──────────────────
  const safetyResult = evaluateSafety(userMessage, context);

  // ── STEP 2: Crisis → Immediate Pathway ────────────────────────────────
  if (safetyResult.riskLevel === RISK_LEVELS.CRISIS) {
    return {
      reply: 'I am deeply concerned about what you have shared. Please reach out to a crisis helpline or emergency services right now. You do not have to face this alone.',
      riskLevel: 'crisis',
      safetyFlag: true,
      crisisResources: getCrisisResources(),
      requiresImmediateAction: true,
      allowNormalConversation: false,
      suggestedActivities: [],
      copingStrategies: [],
      cbtExercises: [],
      journalPrompts: []
    };
  }

  // ── STEP 3: Build wellness context for empathetic response ─────────────
  const firstName = context.userName || 'there';
  const mmwbi = context.mmwbi || null;
  const psych = context.psychometricScores || {};
  const concerns = context.primaryConcerns || [];
  const recoveryScore = context.rwi || null;

  // Extract relevant psychometric context (never diagnose)
  const gadSeverity = psych?.gad7?.severity || null;
  const phqSeverity = psych?.phq9?.severity || null;
  const who5Pct = psych?.who5?.score != null ? psych.who5.score * 4 : null;
  const pssScore = psych?.pss10?.score || null;

  // Estimate emotional state from message
  const text = userMessage.toLowerCase();
  const stressLevel = text.includes('panic') ? 9 : text.includes('overwhelmed') || text.includes('very stressed') ? 8
    : text.includes('stressed') || text.includes('anxious') ? 6
    : text.includes('sad') || text.includes('low') ? 5 : 4;

  const emotionalState = text.includes('anxi') || text.includes('worried') ? 'anxious'
    : text.includes('sad') || text.includes('depressed') ? 'sad'
    : text.includes('stress') || text.includes('overwhelmed') ? 'stressed'
    : text.includes('angry') ? 'angry'
    : 'uncertain';

  // ── STEP 4: Generate reply (Gemini API → rule-based fallback) ──────────
  let reply = '';
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      reply = await generateGeminiReply({
        apiKey, userMessage, firstName, mmwbi, gadSeverity, phqSeverity,
        who5Pct, pssScore, concerns, conversationHistory,
        safetyResult, recoveryScore
      });
    } catch (err) {
      console.warn('Gemini API unavailable, using enhanced fallback:', err.message);
    }
  }

  // Enhanced rule-based fallback if Gemini unavailable or returned empty
  if (!reply) {
    reply = generateFallbackReply(userMessage, firstName, emotionalState, stressLevel, safetyResult, conversationHistory);
  }

  // Clean reply to remove any raw markdown asterisks or formatting symbols for natural human speech/reading
  if (reply) {
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/###?/g, '').trim();
  }

  // ── STEP 5: Select coping strategies + CBT exercises ──────────────────
  const copingStrategies = selectCopingStrategies(userMessage, stressLevel, concerns[0] || '', psych);
  const cbtExercises = selectCBTExercises(emotionalState, stressLevel);
  const journalPrompts = getJournalPrompts(emotionalState);

  // Construct activity list for sidebar
  const suggestedActivities = copingStrategies.map(s => ({
    title: s.title,
    duration: s.duration,
    description: s.description,
    category: s.category
  }));

  return {
    reply,
    riskLevel: safetyResult.riskLabel,
    safetyFlag: safetyResult.riskLevel >= RISK_LEVELS.HIGH_CONCERN,
    showProfessionalSuggestion: safetyResult.showProfessionalSupport || safetyResult.riskLevel === RISK_LEVELS.HIGH_CONCERN,
    suggestedActivities,
    copingStrategies,
    cbtExercises,
    journalPrompts,
    emotionalState,
    stressLevel,
    identifiedConcerns: concerns,
    requiresImmediateAction: false,
    completionStatus: 'active',
    disclaimer: 'AI psychological support. This does not replace professional mental health care.'
  };
};

async function generateGeminiReply({ apiKey, userMessage, firstName, mmwbi, gadSeverity, phqSeverity, who5Pct, pssScore, concerns, conversationHistory, safetyResult, recoveryScore }) {
  // Build safe conversation context (up to last 8 messages)
  const historyText = conversationHistory.slice(-8).map(m =>
    `${m.sender === 'user' ? 'User' : 'Therapeutic Companion'}: ${m.text}`
  ).join('\n');

  const contextInfo = [
    mmwbi ? `Overall wellness index: ${mmwbi}/100` : '',
    gadSeverity ? `Anxiety screening (GAD-7): ${gadSeverity} severity` : '',
    phqSeverity ? `Depression screening (PHQ-9): ${phqSeverity} severity` : '',
    who5Pct ? `Mental well-being (WHO-5): ${who5Pct}%` : '',
    pssScore ? `Perceived stress (PSS-10): ${pssScore}/40` : '',
    concerns.length ? `Primary wellness concerns: ${concerns.slice(0, 2).join(', ')}` : ''
  ].filter(Boolean).join('\n');

  const safetyNote = safetyResult.riskLevel >= RISK_LEVELS.MODERATE_CONCERN
    ? `\nNote: The user's message shows signs of elevated distress. Be extra compassionate, supportive, and gently suggest helpful calming exercises or professional care if needed.`
    : '';

  const prompt = `You are AarogyaMitra's AI Therapeutic Support Companion. You act as a warm, compassionate, supportive therapist-style companion for holistic psychological wellness.

CRITICAL CONVERSATION LINKING RULES:
- Address the user naturally as "${firstName}".
- ALWAYS inspect RECENT CONVERSATION HISTORY. If your previous turn asked a question or guided an exercise (e.g., asking what item they see), and the user replied (e.g., "fan", "desk", "laptop"), ALWAYS directly acknowledge their specific reply first (e.g., "A fan, wonderful! Focus on that fan for a moment..."). NEVER jump to an unrelated topic or generic greeting!
- DO NOT use markdown symbols or asterisks (like **text** or *text*). Write plain, natural, human conversational text.
- IF THE USER WANTS TO JUST TALK, vent, share about their day, or simply chat: Be an open, warm, engaged companion. Listen actively, validate their emotions, reflect back what you hear, and converse naturally.
- IF THE USER IS SHARING STRESS, ANXIETY, SADNESS, OR HARDSHIPS, OR ASKS FOR EXERCISES/ACTIVITIES: Offer empathetic validation and guide them step-by-step through practical, gentle wellness activities.
- Keep responses natural, human, interactive, and relevant to the user's specific words.
- Safety: Maintain ethical boundaries. Do not provide medical diagnoses or prescriptions.${safetyNote}

USER WELLNESS PROFILE:
${contextInfo}

RECENT CONVERSATION HISTORY:
${historyText}

USER'S LATEST MESSAGE: "${userMessage}"

Respond thoughtfully as a warm, therapeutic companion directly acknowledging their latest input:`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 500 }
    })
  });

  if (!response.ok) throw new Error(`Gemini: ${response.statusText}`);
  const json = await response.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function generateFallbackReply(message, firstName, emotionalState, stressLevel, safetyResult, conversationHistory = []) {
  const text = message.toLowerCase().trim();
  const name = firstName !== 'there' ? `, ${firstName}` : '';

  if (safetyResult.riskLevel === RISK_LEVELS.HIGH_CONCERN) {
    return `I hear you${name}, and I am concerned about what you have shared. It sounds like things are very difficult right now. You do not have to face this alone — speaking with a mental health professional can provide deeper, personalized support. Would you like me to show you some professional care resources?`;
  }

  // Find the last message sent by the agent in history to maintain strict thread continuity!
  const lastAgentMsg = [...conversationHistory].reverse().find(m => m.sender === 'agent' || m.sender === 'assistant')?.text?.toLowerCase() || '';

  // ── Thread Continuity: Grounding Exercise Flow ──────────────────────────────
  if (lastAgentMsg.includes('first item you see') || lastAgentMsg.includes('see right in front') || lastAgentMsg.includes('5 things you can see')) {
    return `A ${message}${name}, great catch! Focus on that ${message} for a moment — notice its shape and presence in the room.\n\nNow, tell me 4 things you can physically touch around you right now (like your desk, chair, or clothes).`;
  }

  if (lastAgentMsg.includes('physically touch') || lastAgentMsg.includes('desk, chair, or clothes')) {
    return `Nice awareness${name}. Feeling those items helps bring your mind right back into the physical present.\n\nNext, listen closely... what are 3 distinct sounds you can hear right now, even if quiet?`;
  }

  if (lastAgentMsg.includes('sounds you can hear') || lastAgentMsg.includes('listen closely')) {
    return `Wonderful. Paying attention to those sounds helps quiet racing thoughts.\n\nNow, tell me 2 things you can smell right now, or 1 thing you are tasting.`;
  }

  if (lastAgentMsg.includes('smell right now') || lastAgentMsg.includes('tasting')) {
    return `That completes our 5-4-3-2-1 grounding exercise${name}! You brought your mind right back into the present room.\n\nHow is your breathing and stress level feeling right now?`;
  }

  // ── Thread Continuity: Breathing Exercise Flow ──────────────────────────────
  if (lastAgentMsg.includes('how does your body feel') || lastAgentMsg.includes('4-7-8 breathing') || lastAgentMsg.includes('after doing that')) {
    return `Thank you for sharing that${name}. Staying aware of your body is a great way to regulate stress.\n\nWould you like to continue talking about what was on your mind today, or explore another gentle exercise?`;
  }

  // ── Intent Matching ──────────────────────────────────────────────────────────
  // 1. Breathing Exercise requests
  if (text.includes('breath') || text.includes('breathing')) {
    return `Let's do a calming 4-7-8 Breathing Exercise together${name}:\n\nFirst, inhale slowly through your nose for 4 seconds...\nNext, hold your breath gently for 7 seconds...\nThen, exhale completely through your mouth with a soft sound for 8 seconds...\n\nTake 3 deep cycles right now. Take your time... How does your body feel after doing that?`;
  }

  // 2. Calming activity / grounding requests
  if (text.includes('calming activity') || text.includes('calming') || text.includes('grounding') || text.includes('exercise') || text.includes('activity')) {
    return `Let's try the 5-4-3-2-1 Sensory Grounding Technique together${name}:\n\n• Look around and name 5 things you can see right now.\n• Name 4 things you can physically touch (like your desk or clothes).\n• Name 3 things you can hear around you.\n• Name 2 things you can smell.\n• Name 1 thing you can taste.\n\nTake a moment to look around... What is the first item you see right in front of you?`;
  }

  // 3. User wants to talk / chat / vent ("just talk")
  if (text.includes('talk') || text.includes('chat') || text.includes('vent') || text.includes('listen') || text.includes('share') || text.includes('tell')) {
    return `I am right here with you${name}. Please take all the time you need — tell me about what's been happening or what's on your mind today. I am listening attentively.`;
  }

  // 4. Affirmative / continuation ("yes", "sure", "okay", "i want", "please")
  if (text.includes('yes') || text.includes('sure') || text.includes('okay') || text.includes('ok') || text.includes('please') || text.includes('want to try')) {
    return `Wonderful${name}. Let me guide you through a quick, relaxing practice:\n\nSit comfortably, rest your arms naturally, and gently release the tension in your shoulders and jaw.\n\nNow, take a deep breath in... and slowly let it out.\n\nTell me, what feeling or thought is most present for you right in this moment?`;
  }

  // 5. Short direct replies (e.g. single words like "lamp", "desk", "tired", "sad", "good")
  if (text.split(/\s+/).length <= 3 && text.length > 1) {
    return `I hear you${name} — "${text}". Thank you for sharing that with me. Tell me a bit more about how "${text}" is affecting your day right now.`;
  }

  // 6. Overwhelmed / High Stress
  if (text.includes('overwhelmed') || stressLevel >= 8) {
    return `It sounds like you are carrying a lot right now${name}. When everything feels like too much, it helps to pause and focus on just the next small step. Tell me a bit about what's feeling most overwhelming right now — we can break it down together.`;
  }

  // 7. Stress / Anxiety
  if (text.includes('stressed') || text.includes('anxious') || emotionalState === 'anxious') {
    return `I understand${name} — that feeling of anxiety can be really draining. You are not alone in experiencing this. Tell me about what's triggering this stress today, or let me know if you'd like to try a quick grounding exercise.`;
  }

  // 8. Sadness / Low Mood
  if (emotionalState === 'sad' || text.includes('sad') || text.includes('depressed') || text.includes('low')) {
    return `Thank you for sharing that${name}. It takes courage to acknowledge when we are feeling low. Remember that your feelings are valid, and you don't have to carry them all at once. What has your day been like so far?`;
  }

  // 9. Work / Academic / Deadline Stress
  if (text.includes('work') || text.includes('job') || text.includes('deadline') || text.includes('exam') || text.includes('study')) {
    return `Work and study pressure can build up quickly${name}. It sounds like the demands have been heavy. Would you like to vent about what is making it feel unmanageable, or explore a quick strategy to break your tasks down?`;
  }

  // 10. Varied conversational fallbacks based on message history length
  const fallbacks = [
    `Thank you for opening up${name}. I am here to support you step by step. How are your energy levels feeling overall today?`,
    `I hear you${name}. Exploring how we feel is an important step in wellness. What is one small, gentle thing you could do for yourself today to bring a moment of comfort?`,
    `I'm listening${name}. Whatever is on your mind — whether big or small — feel free to share it with me.`
  ];
  const idx = (conversationHistory.length + text.length) % fallbacks.length;
  return fallbacks[idx];
}
