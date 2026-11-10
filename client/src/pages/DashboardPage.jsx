import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Activity, Brain, Shield, Sparkles, FileText,
  ArrowRight, Moon, Users, TrendingUp, Clock, Bot
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

function ScoreGauge({ score }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="relative flex flex-col items-center">
      <svg width="110" height="65" viewBox="0 0 120 70">
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
  const navigate = useNavigate();
  const {
    wellnessData, loading, hasAssessment,
    mmwbi, domainScores, wellnessCategory,
    currentAgent, recommendationReason, rwi
  } = useWellness();

  const [autoNavCountdown, setAutoNavCountdown] = useState(15);
  const [isPaused, setIsPaused] = useState(false);

  const agentRoute = currentAgent?.toLowerCase().includes('recovery') ? '/agent/recovery-wellness'
    : currentAgent?.toLowerCase().includes('psycho') ? '/agent/psychological-support'
      : currentAgent?.toLowerCase().includes('physical') ? '/agent/physical-activity'
        : currentAgent?.toLowerCase().includes('professional') ? '/agent/professional-support'
          : '/agent/recovery-wellness';

  useEffect(() => {
    if (!hasAssessment || isPaused) return;

    const timer = setInterval(() => {
      setAutoNavCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(agentRoute);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAssessment, isPaused, agentRoute, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl animate-pulse flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
          <HeartPulse className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-semibold" style={{ color: '#9f7dd4' }}>Loading wellness dashboard...</p>
      </div>
    );
  }

  if (!hasAssessment) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="rounded-3xl p-8 text-center space-y-5 shadow-lg text-white"
          style={{ background: 'linear-gradient(135deg, #2a1349, #3d1f6e)' }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-white/10">
            <HeartPulse className="w-8 h-8 text-purple-200" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading">
              Welcome, {user?.firstName}! 👋
            </h1>
            <p className="text-xs text-purple-200/80 mt-1">
              Complete your initial health assessment to unlock your personalized agent journey.
            </p>
          </div>
          <Link to="/assessment" className="btn-primary inline-flex text-xs px-6 py-3">
            Start Assessment <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    );
  }

  const dateFormatted = wellnessData?.result?.createdAt
    ? new Date(wellnessData.result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'Today';

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black font-heading text-purple-950">
            {getGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Your daily wellness summary</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          <Clock className="w-3.5 h-3.5 text-purple-500" />
          <span>Assessed: {dateFormatted}</span>
        </div>
      </div>

      {/* Main Highlights Row */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* 1. MMWBI Summary Card */}
        <div className="rounded-3xl p-5 text-white flex flex-col justify-between space-y-4 shadow-md"
          style={{ background: 'linear-gradient(145deg, #1a0b35, #2a1349)' }}>
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
              Wellness Index (MMWBI)
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700">
              {wellnessCategory}
            </span>
          </div>

          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-5xl font-black text-purple-100">{mmwbi?.toFixed(0)}</p>
              <p className="text-xs text-purple-300/60">out of 100</p>
            </div>
            <ScoreGauge score={mmwbi} />
          </div>

          <div className="flex gap-2 pt-1">
            <Link to="/report" state={{ wellnessData }}
              className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 transition-all">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              View Report
            </Link>
            <Link to="/progress"
              className="flex-1 text-center py-2 text-xs font-bold rounded-xl border border-purple-700/60 hover:bg-purple-900/40 text-purple-300 transition-all">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
              Trends
            </Link>
          </div>
        </div>

        {/* 2. Automated Agent Recommendation Banner */}
        <div className="lg:col-span-2 rounded-3xl p-5 bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 shadow-sm flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-900 text-amber-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-950">Next Recommended Step</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Auto-Opening in {autoNavCountdown}s
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black font-heading text-purple-950">
              {currentAgent || 'Recovery and Wellness Agent'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-purple-100 italic">
              "{recommendationReason || 'System evaluated your health parameters and assigned this node as your immediate focus.'}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors border-none bg-transparent cursor-pointer"
            >
              {isPaused ? '▶ Resume Auto-Navigation' : '⏸ Pause Countdown'}
            </button>

            <button
              type="button"
              onClick={() => navigate(agentRoute)}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-white shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
            >
              <span>Start Session Now</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>

      </div>

      {/* Domain Scores Bar */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm text-purple-950 uppercase tracking-wider">Health Domain Scores</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
            const score = domainScores[key] ?? 0;
            return (
              <div key={key} className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-lg font-black" style={{ color }}>{score?.toFixed(0)}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{label}</p>
                  <div className="w-full h-1 rounded-full mt-1 bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core AI Agents Grid */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm text-purple-950 uppercase tracking-wider">Specialized AI Agents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link to="/agent/recovery-wellness" className="bg-white p-4 rounded-2xl border border-purple-100 hover:border-indigo-300 transition-all space-y-2 shadow-xs hover:no-underline">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {rwi && <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">RWI: {rwi}</span>}
            </div>
            <div>
              <h3 className="font-bold text-xs text-purple-950">Recovery & Wellness</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Circadian rhythm & sleep optimization</p>
            </div>
          </Link>

          <Link to="/agent/psychological-support" className="bg-white p-4 rounded-2xl border border-purple-100 hover:border-purple-300 transition-all space-y-2 shadow-xs hover:no-underline">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-purple-950">Psychological Support</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">CBT reflection & emotional resilience</p>
            </div>
          </Link>

          <Link to="/agent/physical-activity" className="bg-white p-4 rounded-2xl border border-purple-100 hover:border-emerald-300 transition-all space-y-2 shadow-xs hover:no-underline">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-purple-950">Physical Activity</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">MoveNet pose tracking & posture guidance</p>
            </div>
          </Link>

          <Link to="/agent/professional-support" className="bg-white p-4 rounded-2xl border border-purple-100 hover:border-amber-300 transition-all space-y-2 shadow-xs hover:no-underline">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-purple-950">Professional Care</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Clinical referral & care navigation</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
