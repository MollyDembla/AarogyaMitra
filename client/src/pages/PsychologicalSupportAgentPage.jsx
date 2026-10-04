import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, ShieldAlert, Sparkles, BookOpen, Target, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useWellness } from '../context/WellnessContext';
import VoiceInterface from '../components/psych/VoiceInterface';
import MoodTracker from '../components/psych/MoodTracker';
import CrisisOverlay from '../components/psych/CrisisOverlay';
import AgentNavigationHeader from '../components/AgentNavigationHeader';

const JOURNAL_PROMPTS = [
  'How am I feeling right now, and what might be contributing to this?',
  'What happened today that affected my mood or energy?',
  'What emotion did I experience most strongly today?',
  'What helped me today? What would I like to try next time?',
  'What is one thing I am grateful for, even if small?'
];

const TABS = [
  { id: 'chat', label: 'Support Chat', icon: Brain },
  { id: 'mood', label: 'Mood', icon: Sparkles },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'goals', label: 'Goals', icon: Target }
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl rounded-bl-none" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#9f7dd4', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PsychologicalSupportAgentPage() {
  const { wellnessData, user, mmwbi, psychometricScores, primaryConcerns } = useWellness();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([{
    sender: 'agent',
    text: `Hello${user?.firstName ? `, ${user.firstName}` : ''}! I am your AI Psychological Support companion. I am here to offer empathetic support, guided reflection, and evidence-informed wellness activities. How are you feeling today?`,
    riskLevel: 'normal'
  }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [cbtExercises, setCbtExercises] = useState([]);
  const [journalPrompt, setJournalPrompt] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', actions: '', timeframe: '' });
  const [showCrisis, setShowCrisis] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [latestAgentReply, setLatestAgentReply] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load latest session
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/psych/session/latest');
        if (res.data?.session) {
          const s = res.data.session;
          setSessionId(s._id);
          if (s.messages?.length > 0) {
            setMessages(prev => [prev[0], ...s.messages.slice(-20)]);
          }
          if (s.goals?.length > 0) setGoals(s.goals);
        }
      } catch {}
    };
    load();
  }, []);

  const sendMessage = async (text) => {
    const msgText = text || inputText.trim();
    if (!msgText || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: msgText }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/psych/session', {
        userMessage: msgText,
        sessionId
      });

      if (res.success) {
        const out = res.data.agentOutput;
        setSessionId(res.data.sessionId);

        // Crisis overlay
        if (out.riskLevel === 'crisis' || out.requiresImmediateAction) {
          setShowCrisis(true);
        }

        setMessages(prev => [...prev, { sender: 'agent', text: out.reply, riskLevel: out.riskLevel }]);
        setLatestAgentReply(out.reply);

        if (out.suggestedActivities?.length > 0) setSuggestedActivities(out.suggestedActivities);
        if (out.cbtExercises?.length > 0) setCbtExercises(out.cbtExercises);
        if (out.journalPrompts?.length > 0) setJournalPrompt(out.journalPrompts[0]);

        // Show support suggestion
        if (out.showProfessionalSuggestion && !out.requiresImmediateAction) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: 'agent',
              text: 'Based on what you have shared, you might also find it helpful to explore the Professional Care section for personalized guidance on professional support options.',
              riskLevel: 'moderate'
            }]);
          }, 800);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'I am here for you. Let\'s try a short breathing exercise — inhale for 4 seconds, hold for 4, and exhale for 6. Would you like to continue our conversation?',
        riskLevel: 'normal'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const saveJournal = async () => {
    if (!journalContent.trim()) return;
    try {
      await api.post('/psych/journal', { content: journalContent, type: journalPrompt ? 'guided' : 'free', prompts: journalPrompt ? [journalPrompt] : [] });
      setJournalSaved(true);
      setJournalContent('');
      setTimeout(() => setJournalSaved(false), 3000);
    } catch {}
  };

  const saveGoal = async () => {
    if (!newGoal.title.trim()) return;
    try {
      const res = await api.post('/psych/goal', { title: newGoal.title, actions: newGoal.actions.split(',').map(a => a.trim()), timeframe: newGoal.timeframe });
      if (res.success) {
        setGoals(prev => [...prev, res.data.goal]);
        setNewGoal({ title: '', actions: '', timeframe: '' });
      }
    } catch {}
  };

  const getMsgStyle = (msg) => {
    if (msg.sender === 'user') return { bg: 'linear-gradient(135deg, #6b3fb0, #4c1d95)', color: 'white', rounded: 'rounded-2xl rounded-br-none' };
    if (msg.riskLevel === 'crisis') return { bg: '#7f1d1d', color: 'white', rounded: 'rounded-2xl rounded-bl-none' };
    if (msg.riskLevel === 'high_concern' || msg.riskLevel === 'moderate') return { bg: '#fff7ed', color: '#92400e', rounded: 'rounded-2xl rounded-bl-none', border: '1px solid #fde68a' };
    return { bg: '#f8fafc', color: '#1e293b', rounded: 'rounded-2xl rounded-bl-none', border: '1px solid #e2e8f0' };
  };

  return (
    <>
      {showCrisis && <CrisisOverlay onDismiss={() => setShowCrisis(false)} />}

      <div className="max-w-6xl mx-auto space-y-5 pb-8">
        <AgentNavigationHeader activeKey="psychological-support" />
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #f5f0fb, #ede5f7)', border: '1px solid #c9b3f5' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading" style={{ color: '#2a1349' }}>Psychological Support Agent</h1>
              <p className="text-xs mt-0.5" style={{ color: '#6b3fb0' }}>AI Emotional Support · CBT-Informed · Non-Diagnostic</p>
            </div>
          </div>
          {mmwbi && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9f7dd4' }}>Your MMWBI</p>
              <p className="text-2xl font-black" style={{ color: '#6b3fb0' }}>{mmwbi?.toFixed(0)}</p>
            </div>
          )}
        </div>

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border text-xs"
          style={{ background: '#fff8e1', borderColor: '#fde68a', color: '#92400e' }}>
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
          <span><strong>AI Psychological Support Notice:</strong> This agent provides non-diagnostic emotional wellness support and psychoeducation. It does NOT replace a licensed therapist, psychologist, or psychiatrist.</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === id ? 'white' : 'transparent',
                color: activeTab === id ? '#6b3fb0' : '#64748b',
                boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Chat */}
        {activeTab === 'chat' && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Chat Window */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border overflow-hidden"
              style={{ borderColor: '#ede5f7', height: '520px' }}>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((m, idx) => {
                  const style = getMsgStyle(m);
                  return (
                    <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender === 'agent' && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                          style={{ background: '#f5f0fb' }}>
                          <Brain className="w-3.5 h-3.5" style={{ color: '#6b3fb0' }} />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${style.rounded}`}
                        style={{ background: style.bg, color: style.color, border: style.border }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t" style={{ borderColor: '#ede5f7' }}>
                <div className="flex gap-2">
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share how you're feeling... (Press Enter to send)"
                    className="flex-1 px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', minHeight: '44px', maxHeight: '100px' }}
                    rows={1}
                  />
                  <button onClick={() => sendMessage()} disabled={loading || !inputText.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar: Voice + Activities */}
            <div className="space-y-4">
              {/* Voice */}
              <div className="card p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b3fb0' }}>Voice Mode</p>
                <VoiceInterface
                  onTranscript={(t) => { setInputText(t); sendMessage(t); }}
                  agentReply={latestAgentReply}
                />
              </div>

              {/* Suggested Activities */}
              <div className="card p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b3fb0' }}>Suggested Activities</p>
                {suggestedActivities.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedActivities.map((act, idx) => (
                      <div key={idx} className="border rounded-xl overflow-hidden" style={{ borderColor: '#ede5f7' }}>
                        <button className="w-full flex items-center justify-between p-3 text-left"
                          onClick={() => setExpandedActivity(expandedActivity === idx ? null : idx)}>
                          <div>
                            <p className="text-xs font-bold" style={{ color: '#2a1349' }}>{act.title}</p>
                            <p className="text-[10px]" style={{ color: '#9f7dd4' }}>{act.duration} · {act.category}</p>
                          </div>
                          {expandedActivity === idx ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#9f7dd4' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9f7dd4' }} />}
                        </button>
                        {expandedActivity === idx && (
                          <div className="px-3 pb-3 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                            {act.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs p-3 rounded-xl" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                    Chat to receive personalized coping activities.
                    <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#f5f0fb', color: '#6b3fb0' }}>
                      <strong className="block">Try: 4-7-8 Breathing</strong>
                      <span>Inhale 4s · Hold 7s · Exhale 8s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Mood */}
        {activeTab === 'mood' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>Log Today's Mood</h2>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Track mood, stress, and energy to identify patterns over time.</p>
              </div>
              <MoodTracker onLogged={() => {}} />
            </div>
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>About Mood Tracking</h2>
              <div className="space-y-3 text-xs" style={{ color: '#64748b' }}>
                {[
                  'Daily mood logging helps you identify patterns between sleep, activity, and emotional state.',
                  'Over time, the agent can notice patterns such as higher stress on low-sleep days.',
                  'No data is shared externally. Your entries are private to your AarogyaMitra profile.',
                  'Mood entries are non-diagnostic wellness indicators, not clinical assessments.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#9f7dd4' }} />
                    <p>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Journal */}
        {activeTab === 'journal' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>Guided Journal</h2>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Reflect on your day with a guided prompt or write freely.</p>
              </div>

              {/* Prompt selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: '#475569' }}>Select a reflection prompt:</p>
                <div className="space-y-2">
                  {JOURNAL_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => setJournalPrompt(p)}
                      className="w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all"
                      style={{
                        background: journalPrompt === p ? '#f5f0fb' : 'white',
                        borderColor: journalPrompt === p ? '#c9b3f5' : '#e2e8f0',
                        color: journalPrompt === p ? '#6b3fb0' : '#475569'
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {journalPrompt && (
                <div className="p-3 rounded-xl" style={{ background: '#f5f0fb', border: '1px solid #ede5f7' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#6b3fb0' }}>Your prompt:</p>
                  <p className="text-xs italic" style={{ color: '#7c3aed' }}>{journalPrompt}</p>
                </div>
              )}

              <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)}
                placeholder="Write your reflection here..."
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
                style={{ borderColor: '#e2e8f0', minHeight: '140px' }}
              />

              <button onClick={saveJournal} disabled={!journalContent.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: journalSaved ? '#16a34a' : 'linear-gradient(135deg, #6b3fb0, #9f7dd4)', color: 'white' }}>
                {journalSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Journal Entry'}
              </button>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>Free Journaling</h2>
              <p className="text-xs" style={{ color: '#64748b' }}>Write freely without a prompt — just let your thoughts flow.</p>
              <div className="p-3 rounded-xl space-y-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-semibold" style={{ color: '#475569' }}>Journaling benefits:</p>
                {['Reduces emotional burden by externalizing thoughts', 'Helps identify recurring thought patterns', 'Supports self-awareness and emotional regulation'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#64748b' }}>
                    <span style={{ color: '#9f7dd4' }}>·</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Goals */}
        {activeTab === 'goals' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>Create a Wellness Goal</h2>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Small, realistic goals build lasting change.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#475569' }}>Goal</label>
                  <input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Improve daily emotional balance"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#475569' }}>Small actions (comma separated)</label>
                  <input value={newGoal.actions} onChange={e => setNewGoal(p => ({ ...p, actions: e.target.value }))}
                    placeholder="e.g. 5-min breathing, daily reflection"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#475569' }}>Timeframe</label>
                  <input value={newGoal.timeframe} onChange={e => setNewGoal(p => ({ ...p, timeframe: e.target.value }))}
                    placeholder="e.g. 2 weeks"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <button onClick={saveGoal} disabled={!newGoal.title.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)', color: 'white' }}>
                  Create Goal
                </button>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>My Goals ({goals.length})</h2>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.map((g, i) => (
                    <div key={i} className="p-3.5 rounded-xl border space-y-2" style={{ borderColor: '#ede5f7', background: '#faf7fd' }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: '#2a1349' }}>{g.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: g.status === 'completed' ? '#dcfce7' : '#f5f0fb', color: g.status === 'completed' ? '#16a34a' : '#6b3fb0' }}>
                          {g.status}
                        </span>
                      </div>
                      {g.timeframe && <p className="text-[10px]" style={{ color: '#9f7dd4' }}>Timeframe: {g.timeframe}</p>}
                      {g.actions?.length > 0 && (
                        <ul className="space-y-1">
                          {g.actions.map((a, ai) => (
                            <li key={ai} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#64748b' }}>
                              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#9f7dd4' }} /> {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: '#94a3b8' }}>No goals created yet. Set your first wellness goal!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
