import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Brain, Moon, BarChart2, Sparkles, Calendar, ArrowRight, CheckCircle2, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useWellness } from '../context/WellnessContext';

const DOMAIN_CONFIG = [
  { key: 'physicalHealth', label: 'Physical Health', color: '#16a34a' },
  { key: 'recoveryWellness', label: 'Recovery & Wellness', color: '#1d4ed8' },
  { key: 'psychologicalWellbeing', label: 'Psychological', color: '#7c3aed' },
  { key: 'socialWellbeing', label: 'Social', color: '#0891b2' },
  { key: 'lifestyleBalance', label: 'Lifestyle', color: '#d97706' },
  { key: 'stressResilience', label: 'Stress Resilience', color: '#dc2626' },
];

function MiniBar({ value, max = 100, color }) {
  return (
    <div className="h-2.5 rounded-full flex-1" style={{ background: '#f1f5f9' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

function TrendIcon({ current, previous }) {
  if (!previous) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return <Minus className="w-3 h-3" style={{ color: '#94a3b8' }} />;
  if (diff > 0) return <TrendingUp className="w-3 h-3" style={{ color: '#16a34a' }} />;
  return <TrendingDown className="w-3 h-3" style={{ color: '#dc2626' }} />;
}

export default function ProgressPage() {
  const { mmwbi, domainScores, wellnessData, wellnessCategory, primaryConcerns, strengths } = useWellness();
  const [history, setHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [histRes, moodRes] = await Promise.allSettled([
          api.get('/assessment/history'),
          api.get('/psych/mood/history')
        ]);
        if (histRes.status === 'fulfilled' && histRes.value?.success) setHistory(histRes.value.data || []);
        if (moodRes.status === 'fulfilled' && moodRes.value?.success) setMoodHistory(moodRes.value.data?.moodEntries || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Compute MMWBI trend from history
  const sortedHistory = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const latestTwo = sortedHistory.slice(-2);
  const prevMmwbi = latestTwo.length >= 2 ? latestTwo[0]?.overallWellBeingScore : null;
  const mmwbiDiff = mmwbi && prevMmwbi ? (mmwbi - prevMmwbi).toFixed(1) : null;

  // Avg mood from history
  const avgMood = moodHistory.length > 0
    ? (moodHistory.reduce((s, e) => s + (e.moodScore || 0), 0) / moodHistory.length).toFixed(1)
    : null;

  if (loading) {
    return <div className="py-12 text-center text-sm" style={{ color: '#9f7dd4' }}>Loading your progress...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading" style={{ color: '#1a0b35' }}>My Wellness Progress</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Track your multimodal wellness journey over time.</p>
        </div>
        {history.length === 0 && (
          <Link to="/assessment" className="btn-primary text-sm">
            Start Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Current MMWBI',
            value: mmwbi ? `${mmwbi?.toFixed(0)}/100` : '—',
            sub: mmwbiDiff ? `${mmwbiDiff > 0 ? '+' : ''}${mmwbiDiff} pts since last assessment` : 'First assessment',
            color: '#6b3fb0', bg: '#f5f0fb'
          },
          {
            label: 'Assessments Taken',
            value: history.length,
            sub: history.length > 0 ? `Last: ${new Date(sortedHistory[sortedHistory.length-1]?.createdAt).toLocaleDateString('en-IN', { day:'numeric',month:'short' })}` : 'None yet',
            color: '#16a34a', bg: '#f0fdf4'
          },
          {
            label: 'Average Mood',
            value: avgMood ? `${avgMood}/10` : '—',
            sub: `${moodHistory.length} mood log${moodHistory.length !== 1 ? 's' : ''}`,
            color: '#7c3aed', bg: '#f5f3ff'
          },
          {
            label: 'Wellness Category',
            value: wellnessCategory || '—',
            sub: 'From latest assessment',
            color: '#d97706', bg: '#fffbeb'
          }
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
            <p className="text-xl font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] leading-tight" style={{ color: '#94a3b8' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* MMWBI Trend */}
      {sortedHistory.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>MMWBI Trend</h2>
          <div className="space-y-3">
            {sortedHistory.map((item, idx) => {
              const score = item.overallWellBeingScore || 0;
              const prev = idx > 0 ? sortedHistory[idx - 1]?.overallWellBeingScore : null;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-xs w-24 flex-shrink-0" style={{ color: '#64748b' }}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                  <MiniBar value={score} color="#9f7dd4" />
                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                    <TrendIcon current={score} previous={prev} />
                    <span className="text-xs font-black" style={{ color: '#6b3fb0' }}>{score?.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {sortedHistory.length < 2 && (
            <p className="text-xs" style={{ color: '#94a3b8' }}>Complete more assessments to see your trend over time.</p>
          )}
        </div>
      )}

      {/* Domain Progress */}
      {mmwbi && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Domain Scores — Latest Assessment</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {DOMAIN_CONFIG.map(({ key, label, color }) => {
              const score = domainScores[key] ?? 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span className="font-bold" style={{ color }}>{score?.toFixed(0)}/100</span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mood Trend */}
      {moodHistory.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: '#7c3aed' }} />
            <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Mood Trend (Last 14 Days)</h2>
          </div>
          <div className="space-y-2">
            {moodHistory.slice(0, 14).map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-[10px] w-20 flex-shrink-0" style={{ color: '#94a3b8' }}>
                  {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] w-8" style={{ color: '#7c3aed' }}>Mood</span>
                  <MiniBar value={entry.moodScore} max={10} color="#7c3aed" />
                  <span className="text-xs font-bold w-5 text-right" style={{ color: '#7c3aed' }}>{entry.moodScore}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Log mood daily in the Psychological Support Agent for better trends.</p>
        </div>
      )}

      {/* Concerns + Strengths */}
      {mmwbi && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-sm font-heading" style={{ color: '#1a0b35' }}>Current Focus Areas</h2>
            {primaryConcerns.length > 0 ? primaryConcerns.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#ea580c' }} />
                {c}
              </div>
            )) : <p className="text-xs italic" style={{ color: '#94a3b8' }}>No critical concerns identified.</p>}
          </div>
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-sm font-heading" style={{ color: '#1a0b35' }}>Your Strengths</h2>
            {strengths.length > 0 ? strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                {s}
              </div>
            )) : <p className="text-xs italic" style={{ color: '#94a3b8' }}>Strengths are calculated from your assessment.</p>}
          </div>
        </div>
      )}

      {/* No data state */}
      {!mmwbi && (
        <div className="card p-12 text-center space-y-4">
          <BarChart2 className="w-12 h-12 mx-auto" style={{ color: '#c9b3f5' }} />
          <h2 className="font-bold font-heading text-lg" style={{ color: '#2a1349' }}>No Data Yet</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Complete your first wellness assessment to start tracking your progress.</p>
          <Link to="/assessment" className="btn-primary inline-flex">
            Start Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
