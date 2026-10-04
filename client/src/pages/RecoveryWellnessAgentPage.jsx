import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Moon, Activity, Brain, Clock, Zap, Heart, Sun,
  ChevronRight, AlertTriangle, CheckCircle2, HelpCircle, Leaf,
  Wind, RefreshCw, ArrowRight, Star, TrendingUp, Shield, Info
} from 'lucide-react';
import { generateRecoveryPlan, getLatestProfile, submitFeedback, getHistory } from '../services/recoveryService';
import BreathingCorner from '../components/recovery/BreathingCorner';
import MeditationCorner from '../components/recovery/MeditationCorner';
import AgentNavigationHeader from '../components/AgentNavigationHeader';

// ── Dimension meta ────────────────────────────────────────────────────────────
const DIMENSION_META = [
  { key: 'sleepQuality',            label: 'Sleep Quality',              icon: Moon,     color: 'indigo' },
  { key: 'sleepDurationEfficiency', label: 'Sleep Duration & Efficiency',icon: Clock,    color: 'blue'   },
  { key: 'circadianRegularity',     label: 'Circadian Regularity',       icon: Sun,      color: 'amber'  },
  { key: 'daytimeAlertness',        label: 'Daytime Alertness',          icon: Zap,      color: 'yellow' },
  { key: 'fatigueRecoveryAdequacy', label: 'Fatigue & Recovery',         icon: Heart,    color: 'rose'   },
  { key: 'stressRecoveryBalance',   label: 'Stress-Recovery Balance',    icon: Brain,    color: 'violet' }
];

const COLOR_CLASSES = {
  emerald: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
  teal:    { bar: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-800 border-teal-200',         icon: 'bg-teal-100 text-teal-700'    },
  amber:   { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800 border-amber-200',       icon: 'bg-amber-100 text-amber-700'  },
  orange:  { bar: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-800 border-orange-200',    icon: 'bg-orange-100 text-orange-700'},
  red:     { bar: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border-red-200',             icon: 'bg-red-100 text-red-700'      },
  indigo:  { icon: 'bg-indigo-100 text-indigo-700' },
  blue:    { icon: 'bg-blue-100 text-blue-700'     },
  yellow:  { icon: 'bg-yellow-100 text-yellow-700' },
  rose:    { icon: 'bg-rose-100 text-rose-700'     },
  violet:  { icon: 'bg-violet-100 text-violet-700' }
};

function getLevelColor(score) {
  if (score >= 80) return 'emerald';
  if (score >= 65) return 'teal';
  if (score >= 50) return 'amber';
  if (score >= 35) return 'orange';
  return 'red';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RWIGauge({ rwi, level, color }) {
  const circumference = 2 * Math.PI * 60;
  const dash = circumference * (1 - rwi / 100);
  const gradId = 'rwi-grad';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="160" height="160">
          <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle
            cx="80" cy="80" r="60" fill="none" strokeWidth="12"
            strokeLinecap="round"
            stroke={`url(#${gradId})`}
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <text x="80" y="75" textAnchor="middle" className="font-black" fontSize="28" fontWeight="900" fill="#1e293b">{rwi}</text>
          <text x="80" y="95" textAnchor="middle" fontSize="11" fill="#64748b">/100 RWI</text>
        </svg>
      </div>
      <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${COLOR_CLASSES[color]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {level}
      </span>
    </div>
  );
}

function DimensionCard({ meta, score, level }) {
  const Icon = meta.icon;
  const lColor = getLevelColor(score);
  const barClass = COLOR_CLASSES[lColor]?.bar || 'bg-slate-400';
  const iconClass = COLOR_CLASSES[meta.color]?.icon || 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-2xl font-extrabold ${score >= 65 ? 'text-slate-800' : score >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
          {score}
        </span>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{meta.label}</div>
        <div className={`text-[10px] font-semibold ${COLOR_CLASSES[lColor]?.badge?.replace('bg-', 'text-').split(' ')[1] || 'text-slate-500'}`}>
          {level?.label || ''}
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full ${barClass} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const REC_TABS = [
  { key: 'sleepHygiene',      label: 'Sleep Hygiene',  icon: Moon   },
  { key: 'recoveryGuidance',  label: 'Recovery',       icon: Heart  },
  { key: 'stressManagement',  label: 'Stress-Recovery',icon: Brain  },
  { key: 'ayushWellnessGuidance', label: 'AYUSH',      icon: Leaf   }
];

function RecommendationsPanel({ recommendations }) {
  const [activeTab, setActiveTab] = useState('sleepHygiene');
  const recs = recommendations?.[activeTab] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {REC_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
        {recs.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No recommendations for this category.</p>
        ) : (
          recs.map((rec, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${rec.isSafetyRecommendation ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
              <div className="flex items-start gap-2">
                {rec.isSafetyRecommendation
                  ? <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <span className="text-sm font-bold text-slate-900">{rec.title || rec.name || rec.category || `Recommendation ${idx + 1}`}</span>
                  {rec.priority === 'high' && !rec.isSafetyRecommendation && (
                    <span className="ml-2 text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Priority</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">{rec.detail || rec.description || ''}</p>
              {rec.category && <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pl-6">{rec.category}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FeedbackForm({ profile, onFeedbackSubmitted }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ followed: null, improvement: 3, notes: '' });

  const handleSubmit = async () => {
    if (form.followed === null) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        profileId: profile._id,
        recommendationCategory: 'General',
        followed: form.followed,
        difficulty: 3,
        improvement: form.improvement,
        notes: form.notes
      });
      setSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (e) {
      console.error('Feedback error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-emerald-800">Feedback recorded. Thank you!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-purple-600" /> Progress Check-In
      </h4>
      <div>
        <p className="text-xs text-slate-600 mb-2 font-medium">Did you try any of the recommendations?</p>
        <div className="flex gap-2">
          {[['Yes', true], ['Partially', 'partial'], ['Not yet', false]].map(([label, val]) => (
            <button
              key={String(val)}
              onClick={() => setForm(f => ({ ...f, followed: val }))}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${form.followed === val ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-purple-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-2 font-medium">How do you feel compared to before? (1 = Much worse, 5 = Much better)</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setForm(f => ({ ...f, improvement: n }))}
              className={`w-9 h-9 rounded-xl text-sm font-extrabold border transition-all ${form.improvement === n ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-purple-300'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Optional: any observations or comments..."
        className="w-full text-xs p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
        rows={2}
      />
      <button
        onClick={handleSubmit}
        disabled={form.followed === null || submitting}
        className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
      >
        {submitting ? 'Saving...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

function RoutinePlanPanel({ profile, onUpdatePlan, generating }) {
  const [customCond, setCustomCond] = useState(profile?.exceptionalConditions || '');
  const routine = profile?.routinePlan || null;

  const PRESETS = [
    "I need to stay awake till late night so I can't get 8 hrs of sleep",
    "Night shift / rotating shift schedule",
    "Early morning commute (wake up at 5:00 AM)",
    "Can't exercise in the morning due to work schedule"
  ];

  const handleApplyPreset = (preset) => {
    setCustomCond(preset);
  };

  const handleTriggerUpdate = () => {
    onUpdatePlan(customCond);
  };

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold font-heading text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" /> Actionable Routine Improvement Plan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Personalized routine modifications and step-by-step daily schedule tailored to your recovery goals & life constraints.
          </p>
        </div>
      </div>

      {/* Exceptional Conditions Customizer */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 p-5 rounded-2xl border border-purple-200/70 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> Exceptional Conditions & Schedule Constraints
          </h3>
          {profile?.exceptionalConditions && (
            <span className="text-[10px] font-extrabold bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">
              Customized
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600">
          Have special constraints (e.g. late night work, night shifts, early wake-ups)? Select or type your condition below to adapt your routine plan!
        </p>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                customCond === p
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            value={customCond}
            onChange={(e) => setCustomCond(e.target.value)}
            placeholder="Type any specific schedule condition (e.g. staying awake till late night)..."
            className="flex-1 text-xs px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-slate-800 font-medium"
          />
          <button
            onClick={handleTriggerUpdate}
            disabled={generating}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Adapting Plan...' : 'Adapt & Regenerate Plan'}
          </button>
        </div>
      </div>

      {/* Routine Plan Display */}
      {routine && (
        <div className="space-y-6 pt-2">
          {/* Major Changes Needed */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Major Routine Changes Needed
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {(routine.majorChanges || []).map((mc, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-purple-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{mc.title}</span>
                    {mc.impact && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex-shrink-0">
                        {mc.impact}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{mc.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Execution Schedule */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-teal-600" /> Daily Execution Schedule (How To Do Them)
            </h3>
            <div className="space-y-3">
              {(routine.dailySchedule || []).map((ds, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">
                      {ds.timeframe}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{ds.phase}</span>
                  </div>
                  <ul className="space-y-1.5 pt-1">
                    {(ds.actions || []).map((act, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Guidance Note */}
          {routine.executionGuidance && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{routine.executionGuidance}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecoveryWellnessAgentPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await getLatestProfile();
      if (p) setProfile(p);
      const h = await getHistory();
      if (Array.isArray(h)) setHistory(h);
    } catch (e) {
      console.warn('No recovery profile yet.', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    };
    init();
  }, [fetchProfile, feedbackRefresh]);

  const handleGenerate = async (exceptionalConds = '') => {
    setGenerating(true);
    setError('');
    try {
      const result = await generateRecoveryPlan(null, typeof exceptionalConds === 'string' ? exceptionalConds : '');
      if (result?.recoveryProfile || result?.agentOutput) {
        const newProfile = result.recoveryProfile || result.agentOutput;
        setProfile(newProfile);
        await fetchProfile();
      }
    } catch (e) {
      setError('Could not generate recovery plan. Please ensure you have completed an assessment first.');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Loading Recovery Agent...
      </div>
    );
  }

  const agentOutput = profile?.dimensionScores ? profile : null;
  const rwi = agentOutput?.recoveryWellnessIndex ?? 0;
  const rwiLevel = agentOutput?.overallRecoveryLevel ?? '';
  const rwiColor = agentOutput?.rwiColor ?? 'amber';
  const dims = agentOutput?.dimensionScores ?? {};
  const dimLevels = agentOutput?.dimensionLevels ?? {};
  const recs = agentOutput?.personalizedRecommendations ?? {};
  const dateStr = agentOutput?.createdAt
    ? new Date(agentOutput.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <AgentNavigationHeader activeKey="recovery-wellness" />

      {/* ── SECTION 1: Agent Header ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-teal-800/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/50 rounded-xl border border-teal-600/30">
              <Moon className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-white">Recovery and Wellness Agent</h1>
              <p className="text-sm text-teal-300">Sleep · Recovery · Circadian Rhythm · Fatigue · Stress-Recovery Balance</p>
            </div>
          </div>
          {agentOutput && (
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed mt-1">
              Last analyzed on {dateStr}. The Recovery and Wellness Index (RWI) is a prototype wellness indicator — not a clinical diagnosis.
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {agentOutput ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Updating...' : 'Re-analyze'}
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all"
            >
              <Sparkles className={`w-5 h-5 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Analyzing your recovery profile...' : 'Generate Recovery Analysis'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── No profile state ─── */}
      {!agentOutput && !generating && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <Moon className="w-14 h-14 text-teal-500 mx-auto" />
          <h2 className="text-xl font-bold font-heading text-slate-900">Your Recovery Profile</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Click "Generate Recovery Analysis" above. The agent will analyze your sleep patterns, stress levels, lifestyle habits, and wellness report to build a personalized recovery profile.
          </p>
        </div>
      )}

      {/* ── SECTION 2: RWI Score + Dimensions ────────────────────────────── */}
      {agentOutput && (
        <>
          {/* Safety Alert */}
          {agentOutput.alertnessSafetyFlag && (
            <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 text-amber-900 p-5 rounded-2xl text-sm">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Daytime Alertness — Wellness Guidance</p>
                <p className="text-amber-800 leading-relaxed">{agentOutput.safetyMessage}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* RWI Score Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center gap-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recovery Wellness Index</h2>
              <RWIGauge rwi={rwi} level={rwiLevel} color={rwiColor} />
              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>Prototype wellness indicator. Not a clinical diagnostic score.</span>
              </div>
            </div>

            {/* Recovery Summary */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" /> Recovery Analysis Summary
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">{agentOutput.recoverySummary}</p>

              {/* Primary + Secondary concerns */}
              {agentOutput.primaryConcern && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Primary Concern: </span>
                    <span>{agentOutput.primaryConcern}</span>
                  </div>
                </div>
              )}

              {agentOutput.secondaryConcerns?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Secondary Concerns</p>
                  {agentOutput.secondaryConcerns.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actionable Routine Improvement Plan & Exceptional Conditions */}
          <RoutinePlanPanel profile={agentOutput} onUpdatePlan={handleGenerate} generating={generating} />

          {/* 6 Dimension Cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> 6-Dimension Recovery Profile
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {DIMENSION_META.map(meta => (
                <DimensionCard
                  key={meta.key}
                  meta={meta}
                  score={dims[meta.key] ?? 0}
                  level={dimLevels[meta.key]}
                />
              ))}
            </div>
          </div>

          {/* Contributing & Protective Factors */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Contributing Factors
              </h3>
              <ul className="space-y-2">
                {(agentOutput.contributingFactors || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Protective Factors
              </h3>
              <ul className="space-y-2">
                {(agentOutput.protectiveFactors || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── SECTION 3: Personalized Guidance ── */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" /> Personalized Guidance
            </h2>
            <RecommendationsPanel recommendations={recs} />
          </div>

          {/* ── SECTION 4: Progress + Feedback ── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* RWI History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> RWI Progress History
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Your history will appear here after multiple analyses.</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{h.overallRecoveryLevel}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                            style={{ width: `${h.recoveryWellnessIndex}%` }}
                          />
                        </div>
                        <span className="text-sm font-extrabold text-slate-800">{h.recoveryWellnessIndex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback Form */}
            <FeedbackForm
              profile={agentOutput}
              onFeedbackSubmitted={() => setFeedbackRefresh(r => r + 1)}
            />
          </div>

          {/* ── Follow-up Questions ── */}
          {agentOutput.followUpQuestions?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Follow-Up Reflection Questions
              </h3>
              <p className="text-xs text-slate-500">Reflect on these questions during your next check-in to track your progress:</p>
              <ul className="space-y-2">
                {agentOutput.followUpQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" /> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 5: WELLNESS PRACTICE CORNER (architecturally INDEPENDENT)
          Does NOT affect RWI, agent routing, or any decision-making flow.
         ───────────────────────────────────────────────────────────────────── */}
      <div className="border-t-2 border-dashed border-slate-200 pt-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-teal-200 to-violet-200" />
          <div className="text-center">
            <h2 className="text-base font-bold font-heading text-slate-800">Wellness Practice Corner</h2>
            <p className="text-xs text-slate-500 mt-0.5">Independent voluntary practices · Not part of your RWI score or agent routing</p>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-teal-200 to-violet-200" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Breathing Corner Card */}
          <button
            onClick={() => setShowBreathing(true)}
            className="group text-left bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 rounded-3xl p-6 transition-all hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Wind className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">Breathing Corner</h3>
                <p className="text-xs text-blue-700 font-semibold">4 guided breathing exercises</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Take a guided breathing break with Box Breathing, 4-7-8, Deep Belly Breathing, and Slow Relaxation — each with animated guidance and a countdown timer.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {['Box Breathing', '4-7-8', 'Deep Belly', 'Slow Relaxation'].map(e => (
                <span key={e} className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">{e}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-blue-700 font-bold text-sm">
              Open Practice <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Meditation Corner Card */}
          <button
            onClick={() => setShowMeditation(true)}
            className="group text-left bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 hover:border-violet-400 rounded-3xl p-6 transition-all hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">Meditation & Mindfulness</h3>
                <p className="text-xs text-violet-700 font-semibold">5 guided mindfulness practices</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Practice short moments of calm with Quick Calm, Mindful Breathing, Body Awareness, Guided Relaxation, and Mindful Pause — with step-by-step guided instructions.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {['Quick Calm', 'Mindful Breathing', 'Body Awareness', 'Guided Relaxation', 'Mindful Pause'].map(e => (
                <span key={e} className="bg-violet-100 text-violet-800 border border-violet-200 px-2.5 py-1 rounded-full font-semibold">{e}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-violet-700 font-bold text-sm">
              Open Practice <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Independent Practice Modals */}
      {showBreathing && <BreathingCorner onClose={() => setShowBreathing(false)} />}
      {showMeditation && <MeditationCorner onClose={() => setShowMeditation(false)} />}
    </div>
  );
}
