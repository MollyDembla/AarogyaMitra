import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Activity, Brain, Shield, Sparkles, FileText,
  ArrowRight, CheckCircle2, RotateCcw, Calendar, Moon,
  Users, HelpCircle, TrendingUp, TrendingDown, Minus,
  Zap, AlertTriangle, Clock, ChevronRight, User
} from 'lucide-react';
import { useWellness } from '../context/WellnessContext';

const DOMAIN_CONFIG = [
  { key: 'physicalHealth', label: 'Physical Health', icon: Activity, color: '#16a34a', bg: '#f0fdf4' },
  { key: 'recoveryWellness', label: 'Recovery & Wellness', icon: Moon, color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'psychologicalWellbeing', label: 'Psychological', icon: Brain, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'socialWellbeing', label: 'Social Well-Being', icon: Users, color: '#0891b2', bg: '#ecfeff' },
  { key: 'lifestyleBalance', label: 'Lifestyle Balance', icon: Sparkles, color: '#d97706', bg: '#fffbeb' },
  { key: 'stressResilience', label: 'Stress Resilience', icon: HeartPulse, color: '#dc2626', bg: '#fef2f2' },
];

const QUICK_ACTIONS = [
  { label: 'Recovery & Wellness', path: '/agent/recovery-wellness', icon: Moon, color: '#1d4ed8', bg: '#dbeafe' },
  { label: 'Psychological Support', path: '/agent/psychological-support', icon: Brain, color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Physical Activity', path: '/agent/physical-activity', icon: Activity, color: '#16a34a', bg: '#dcfce7' },
  { label: 'My Report', path: '/report', icon: FileText, color: '#6b3fb0', bg: '#f5f0fb' },
  { label: 'My Progress', path: '/progress', icon: TrendingUp, color: '#d97706', bg: '#fffbeb' },
  { label: 'Professional Care', path: '/agent/professional-support', icon: Shield, color: '#b45309', bg: '#fef3c7' },
];

function ScoreChange({ current, previous }) {
  if (!previous || previous === current) return <span className="text-xs text-slate-400 flex items-center gap-1"><Minus className="w-3 h-3" /> No change</span>;
  const diff = current - previous;
  if (diff > 0) return (
    <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#16a34a' }}>
      <TrendingUp className="w-3 h-3" /> +{diff.toFixed(1)} pts
    </span>
  );
  return (
    <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
      <TrendingDown className="w-3 h-3" /> {diff.toFixed(1)} pts
    </span>
  );
}

function ScoreGauge({ score }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M10 65 A50 50 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 157} 157`}
        />
        <line
          x1="60" y1="65"
          x2={60 + 40 * Math.cos((angle * Math.PI) / 180)}
          y2={65 + 40 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx="60" cy="65" r="4" fill={color} />
      </svg>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage({ user }) {
  const {
    wellnessData, loading, hasAssessment,
    mmwbi, domainScores, wellnessCategory,
    primaryConcerns, strengths, currentAgent,
    recommendationReason, rwi, psychometricScores
  } = useWellness();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl animate-pulse flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
          <HeartPulse className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium" style={{ color: '#9f7dd4' }}>Loading your wellness dashboard...</p>
      </div>
    );
  }

  if (!hasAssessment) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <div className="rounded-3xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #2a1349, #3d1f6e)' }}>
          <div className="p-10 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(201,179,245,0.15)' }}>
              <HeartPulse className="w-10 h-10" style={{ color: '#c9b3f5' }} />
            </div>
            <div>
              <h1 className="text-3xl font-black font-heading text-white mb-2">
                Welcome, {user?.firstName}! 👋
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(201,179,245,0.7)' }}>
                Begin your wellness journey by completing the initial assessment. Your multimodal profile will unlock all specialized agents and personalized guidance.
              </p>
            </div>
            <Link to="/assessment"
              className="btn-primary inline-flex">
              Start Initial Assessment <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['Wellness Assessment', 'Personalized Report', 'AI Agent Routing'].map((t, i) => (
            <div key={t} className="card p-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center"
                style={{ background: '#f5f0fb' }}>
                <span className="text-sm font-black" style={{ color: '#6b3fb0' }}>{i + 1}</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: '#2a1349' }}>{t}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { report, journey } = wellnessData || {};
  const dateFormatted = wellnessData?.result?.createdAt
    ? new Date(wellnessData.result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';
  const agentRoute = currentAgent?.toLowerCase().includes('recovery') ? '/agent/recovery-wellness'
    : currentAgent?.toLowerCase().includes('psycho') ? '/agent/psychological-support'
      : currentAgent?.toLowerCase().includes('physical') ? '/agent/physical-activity'
        : currentAgent?.toLowerCase().includes('professional') ? '/agent/professional-support'
          : '/agent/recovery-wellness';

  return (
    <div className="space-y-7 pb-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading" style={{ color: '#1a0b35' }}>
            {getGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Here is your multimodal wellness overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#9f7dd4' }}>
          <Clock className="w-4 h-4" />
          Last assessed: {dateFormatted}
        </div>
      </div>

      {/* Top row: MMWBI + Reasoning */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* MMWBI Card */}
        <div className="rounded-3xl p-6 text-white space-y-4 flex flex-col justify-between"
          style={{ background: 'linear-gradient(145deg, #1a0b35, #2a1349, #3d1f6e)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(201,179,245,0.6)' }}>
              Multimodal Well-Being Index
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,179,245,0.15)', color: '#c9b3f5' }}>
              {wellnessCategory}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-6xl font-black" style={{ color: '#e2d5ff' }}>{mmwbi?.toFixed(0)}</p>
              <p className="text-sm" style={{ color: 'rgba(201,179,245,0.5)' }}>out of 100</p>
            </div>
            <ScoreGauge score={mmwbi} />
          </div>

          {/* Mini domain mini-bars */}
          <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'rgba(139,98,217,0.2)' }}>
            {Object.entries(domainScores).slice(0, 3).map(([k, v]) => {
              const cfg = DOMAIN_CONFIG.find(d => d.key === k);
              if (!cfg || !v) return null;
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-[10px] flex-1" style={{ color: 'rgba(201,179,245,0.6)' }}>{cfg.label}</span>
                  <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: '#9f7dd4' }} />
                  </div>
                  <span className="text-[10px] font-bold w-6 text-right" style={{ color: '#c9b3f5' }}>{v?.toFixed(0)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Link to="/report" state={{ wellnessData }}
              className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all"
              style={{ background: 'rgba(139,98,217,0.3)', color: '#e2d5ff' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,98,217,0.5)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,98,217,0.3)'}>
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              View Report
            </Link>
            <Link to="/profile"
              className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl border transition-all"
              style={{ background: 'transparent', color: 'rgba(201,179,245,0.6)', borderColor: 'rgba(139,98,217,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,98,217,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <User className="w-3.5 h-3.5 inline mr-1.5" />
              My Profile
            </Link>
          </div>
        </div>

        {/* Stateful LangGraph Health Assistant Guide & Dynamic Journey */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between space-y-5"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', border: '1px solid #e9d8fd' }}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#6b3fb0' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: '#6b3fb0' }}>LangGraph State Orchestrator</span>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
              Dynamic State Recommendation
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Current Recommended Step
              </span>
              <h3 className="text-2xl font-black font-heading mt-1.5" style={{ color: '#1a0b35' }}>
                {currentAgent || 'Recovery & Wellness Agent'}
              </h3>
            </div>

            {/* LangGraph State Analysis Rationale */}
            <div className="p-4 rounded-2xl border flex items-start gap-3 bg-white border-purple-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7c3aed' }} />
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#5b21b6' }}>LangGraph State Evaluation Rationale:</p>
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                  {recommendationReason || report?.recommendedNextStep || 'LangGraph state engine analyzed health metrics and dynamically assigned this node as your immediate priority.'}
                </p>
              </div>
            </div>

            {/* Dynamic Executed Journey History with Real Scores */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Executed Journey History & Scores
                </p>
                <span className="text-[10px] font-semibold text-purple-600">
                  Real-time LangGraph Journey
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {/* Step 1: Multimodal Assessment (Always Completed) */}
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-[11px] block">1. Assessment</span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Score: {mmwbi ? `${mmwbi.toFixed(0)}/100 MMWBI` : 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Deduplicated Completed Agents from Journey State */}
                {(() => {
                  const rawCompleted = wellnessData?.journey?.completedAgents || [];
                  const seen = new Set(['wellness_assessment', 'assessment']);
                  const uniqueList = [];

                  rawCompleted.forEach(a => {
                    const str = String(a).toLowerCase();
                    let key = a;
                    if (str.includes('professional') || str.includes('care')) key = 'Professional Care';
                    else if (str.includes('psycho')) key = 'Psychological Support';
                    else if (str.includes('physic')) key = 'Physical Activity';
                    else if (str.includes('recovery')) key = 'Recovery & Wellness';

                    if (key !== 'wellness_assessment' && !seen.has(key)) {
                      seen.add(key);
                      uniqueList.push({ name: key, raw: a });
                    }
                  });

                  return uniqueList.map((item, idx) => {
                    let scoreLabel = 'Completed';
                    const lowerName = item.name.toLowerCase();
                    if (lowerName.includes('recovery') && rwi) {
                      scoreLabel = `RWI: ${rwi}/100`;
                    } else if (lowerName.includes('psycho') && psychometricScores?.who5?.score) {
                      scoreLabel = `WHO-5: ${psychometricScores.who5.score}/100`;
                    } else if (lowerName.includes('physical')) {
                      scoreLabel = 'Pose Acc: Evaluated';
                    }

                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-[11px] block">{item.name}</span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Score: {scoreLabel}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Current Ongoing Agent */}
                {currentAgent && currentAgent !== 'Journey Complete' && (
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 shadow-md">
                    <Sparkles className="w-4 h-4 text-purple-200 animate-spin flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] block">{currentAgent.replace(' Agent', '')}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded">
                        Active Step (In Progress)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Future Steps Notice - No Pre-Decided Steps */}
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-[11px] flex items-center gap-2 mt-2">
                <RotateCcw className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 animate-spin" />
                <span>
                  <strong>Next Agent Step:</strong> LangGraph state engine will reassess health outputs after this node to recommend the next step.
                </span>
              </div>
            </div>
          </div>

          <Link to={agentRoute}
            className="btn-primary inline-flex w-full sm:w-fit text-sm items-center justify-center gap-2 py-3 px-6 shadow-md mt-2">
            Start Recommended Step ({currentAgent || 'Recovery Agent'}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Domain Scores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-heading text-lg" style={{ color: '#1a0b35' }}>Domain Scores</h2>
          <Link to="/progress" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#6b3fb0' }}>
            View Trends <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
            const score = domainScores[key] ?? 0;
            return (
              <div key={key} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-xl font-black" style={{ color }}>{score?.toFixed(0)}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider leading-tight" style={{ color: '#64748b' }}>{label}</p>
                  <div className="w-full h-1.5 rounded-full mt-2" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery + Psych Cards + Concerns/Strengths */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Recovery Card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Moon className="w-4 h-4" style={{ color: '#1d4ed8' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#1d4ed8' }}>Recovery & Wellness</span>
          </div>
          {rwi ? (
            <div>
              <p className="text-3xl font-black" style={{ color: '#1d4ed8' }}>{rwi}<span className="text-base font-medium text-slate-400">/100</span></p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>Recovery Wellness Index</p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#94a3b8' }}>Visit the Recovery Agent to generate your RWI score.</p>
          )}
          <Link to="/agent/recovery-wellness" className="text-xs font-bold flex items-center gap-1" style={{ color: '#1d4ed8' }}>
            Go to Agent <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Psychological Card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f5f3ff' }}>
              <Brain className="w-4 h-4" style={{ color: '#7c3aed' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>Psychological Support</span>
          </div>
          <div>
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              {wellnessData?.result?.psychometricScores?.who5?.interpretation || 'Begin a session with the Psychological Support Agent.'}
            </p>
          </div>
          <Link to="/agent/psychological-support" className="text-xs font-bold flex items-center gap-1" style={{ color: '#7c3aed' }}>
            Start Session <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Primary Concerns */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fff7ed' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#ea580c' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ea580c' }}>Focus Areas</span>
          </div>
          <ul className="space-y-1.5">
            {primaryConcerns.length > 0 ? primaryConcerns.slice(0, 3).map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#ea580c' }} />
                {c}
              </li>
            )) : (
              <li className="text-xs italic" style={{ color: '#94a3b8' }}>No critical concerns identified.</li>
            )}
          </ul>
        </div>

        {/* Strengths */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#16a34a' }}>Your Strengths</span>
          </div>
          <ul className="space-y-1.5">
            {strengths.length > 0 ? strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#16a34a' }} />
                {s}
              </li>
            )) : (
              <li className="text-xs italic" style={{ color: '#94a3b8' }}>Maintaining your daily routine is a strength.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="font-bold font-heading text-lg" style={{ color: '#1a0b35' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ label, path, icon: Icon, color, bg }) => (
            <Link key={path} to={path}
              className="card p-4 flex flex-col items-center text-center gap-3 hover:no-underline">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-xs font-semibold leading-tight" style={{ color: '#2a1349' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
