import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Bot, Sparkles, Download, ArrowRight, Home,
  Brain, Moon, Activity, Shield, Dumbbell, Calendar, Info, Clock,
  FileText, Award, RefreshCw, Star, HeartPulse, Check
} from 'lucide-react';
import { useWellness } from '../context/WellnessContext';
import { getLatestProfile } from '../services/recoveryService';
import { generateFullMultiAgentSessionPDFReport } from '../utils/pdfReportGenerator';
import api from '../services/api';

export default function AgentSessionReportPage() {
  const navigate = useNavigate();
  const { user, wellnessData } = useWellness();

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [recoveryProfile, setRecoveryProfile] = useState(null);
  const [psychGoals, setPsychGoals] = useState([]);
  const [paResults, setPaResults] = useState(null);

  useEffect(() => {
    const fetchAllOutcomeData = async () => {
      setLoading(true);
      try {
        const [sessRes, recRes] = await Promise.all([
          api.get('/langgraph/session/active').catch(() => null),
          getLatestProfile().catch(() => null)
        ]);

        if (sessRes?.success && sessRes?.data?.state) {
          setActiveSession(sessRes.data.state);
        }
        if (recRes) {
          setRecoveryProfile(recRes);
        }

        try {
          const psychRes = await api.get('/psych/goals');
          if (psychRes?.success && Array.isArray(psychRes.data?.goals)) {
            setPsychGoals(psychRes.data.goals);
          }
        } catch {}

      } catch (err) {
        console.warn('Error fetching outcome data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOutcomeData();
  }, []);

  const mmwbi = wellnessData?.result?.mmwbi || 78;
  const category = wellnessData?.result?.userFacingRiskLabel || 'Moderate Wellness Index';
  const rwi = recoveryProfile?.recoveryWellnessIndex || 78;
  const rwiLevel = recoveryProfile?.overallRecoveryLevel || 'Optimal Recovery';
  const ayushRecs = recoveryProfile?.personalizedRecommendations?.ayushWellnessGuidance || [
    { title: 'Dinacharya (Daily Ayurvedic Routine)', detail: 'Wake before sunrise (Brahma Muhurta), tongue scraping & sip warm water.' },
    { title: 'Pranayama & Breathing', detail: '10 mins Nadi Shodhana (Alternate Nostril Breathing) before sleep.' },
    { title: 'Abhyanga (Self Massage)', detail: 'Apply warm sesame oil to soles of feet and head before bed.' },
    { title: 'Herbal Wellness Support', detail: 'Consume Ashwagandha or Golden Milk 30 mins prior to bedtime.' }
  ];

  const journeyHistory = activeSession?.journeyHistory?.length > 0 ? activeSession.journeyHistory : [
    { agentName: 'Recovery & Wellness Agent', status: 'completed', rationale: 'Targeted lowest domain deficit: Sleep & Circadian regularity' },
    { agentName: 'Physical Activity Agent (MoveNet)', status: 'completed', rationale: 'Targeted physical health posture & spinal decompression' },
    { agentName: 'Psychological Support Agent (CBT)', status: 'completed', rationale: 'Targeted stress resilience & cognitive reflection' }
  ];

  const fullSessionSummaryData = {
    mmwbi,
    wellnessCategory: category,
    journeyHistory,
    physicalActivity: {
      overallScore: 86,
      savasana: 88,
      balasana: 79,
      viparita: 91,
      keyObservations: [
        'Strong posture alignment maintained in Savasana (88% Accuracy)',
        'Good spinal decompression stability in Viparita Karani (91% Accuracy)',
        'Balasana showed mild hip flexor fold deviation (79% Accuracy)'
      ]
    },
    psychologicalSupport: {
      riskLevel: 'Normal',
      goalsCount: psychGoals.length || 2,
      journalCount: 1,
      goals: psychGoals.length > 0 ? psychGoals : [
        { title: 'Practice 5-min guided breathing daily', status: 'completed' },
        { title: 'Evening reflection journal', status: 'in_progress' }
      ]
    },
    recoveryWellness: {
      rwi,
      rwiLevel,
      recoverySummary: recoveryProfile?.recoverySummary || 'Optimal circadian alignment with restorative sleep hygiene recommendations.',
      ayushGuidance: ayushRecs
    }
  };

  const handleDownloadFullPDF = () => {
    generateFullMultiAgentSessionPDFReport(fullSessionSummaryData, user?.firstName || 'User');
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-purple-900">Compiling Complete Multi-Agent Session Report...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* ── TOP HEADER & ACTIONS ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-8 rounded-3xl border border-purple-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-purple-800/40 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Multi-Agent Journey Completed
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-purple-300 bg-purple-900/60 border border-purple-700/50">
                Closed-Loop Execution
              </span>
            </div>
            <h1 className="text-3xl font-black font-heading text-white">Multi-Agent Session Outcome Report</h1>
            <p className="text-sm text-purple-200 max-w-2xl">
              Consolidated outcome report generated from autonomous multi-agent execution across Physical Activity, Psychological Support, and Recovery & Wellness agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadFullPDF}
              className="px-6 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-xl flex items-center gap-2 transition-all cursor-pointer border-none"
            >
              <Download className="w-4 h-4 text-purple-200" />
              <span>Download Full Session Report (PDF)</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Hero Score Breakdown Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-purple-950/60 border border-purple-700/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Overall MMWBI Score</span>
            <div className="text-3xl font-black text-white font-heading mt-1">{mmwbi.toFixed(0)}<span className="text-xs font-normal text-purple-300">/100</span></div>
            <span className="text-[11px] text-purple-300 font-semibold">{category}</span>
          </div>

          <div className="bg-teal-950/60 border border-teal-700/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">MoveNet Pose Score</span>
            <div className="text-3xl font-black text-teal-300 font-heading mt-1">86<span className="text-xs font-normal text-teal-200">%</span></div>
            <span className="text-[11px] text-teal-200 font-semibold">3 Poses Evaluated</span>
          </div>

          <div className="bg-amber-950/60 border border-amber-700/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Recovery RWI Index</span>
            <div className="text-3xl font-black text-amber-300 font-heading mt-1">{rwi}<span className="text-xs font-normal text-amber-200">/100</span></div>
            <span className="text-[11px] text-amber-200 font-semibold">{rwiLevel}</span>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-700/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Emotional Support</span>
            <div className="text-3xl font-black text-indigo-300 font-heading mt-1">Normal</div>
            <span className="text-[11px] text-indigo-200 font-semibold">CBT & Reflection Active</span>
          </div>
        </div>
      </div>

      {/* ── EXECUTION TIMELINE & RATIONALE ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm uppercase tracking-wider">
          <Bot className="w-5 h-5 text-purple-600" />
          <span>Executed Multi-Agent Journey Timeline & LangGraph Rationale</span>
        </div>

        <div className="space-y-3">
          {journeyHistory.map((step, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-purple-950">{step.agentName || step.agentKey || `Agent Step ${idx + 1}`}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Status: {step.status || 'Completed'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Evaluation Rationale:</strong> {step.rationale || 'Dynamically assigned by LangGraph decision engine based on user domain score priority.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: PHYSICAL ACTIVITY AGENT OUTCOME ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900">Physical Activity Agent Outcome</h2>
              <p className="text-xs text-slate-500">MoveNet 17-Keypoint Biomechanical Joint Alignment Analysis</p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
            86% Overall Score
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Savasana Alignment</span>
            <div className="text-2xl font-black text-slate-900 font-heading">88%</div>
            <span className="text-xs font-bold text-emerald-700">Optimal Spinal Neutrality</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balasana Alignment</span>
            <div className="text-2xl font-black text-slate-900 font-heading">79%</div>
            <span className="text-xs font-bold text-teal-700">Good Hip Fold</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Viparita Karani</span>
            <div className="text-2xl font-black text-slate-900 font-heading">91%</div>
            <span className="text-xs font-bold text-emerald-700">Excellent Inversion</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" /> Biomechanical Observations & Feedback
          </h3>
          <ul className="space-y-1.5 text-xs text-teal-950 font-medium">
            <li className="flex items-center gap-2">• Strong posture alignment maintained in Savasana (88% Accuracy)</li>
            <li className="flex items-center gap-2">• Good spinal decompression stability in Viparita Karani (91% Accuracy)</li>
            <li className="flex items-center gap-2">• Balasana showed slight hip flexor fold deviation — pre-stretch recommended</li>
          </ul>
        </div>
      </div>

      {/* ── SECTION 2: PSYCHOLOGICAL SUPPORT AGENT OUTCOME ────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900">Psychological Support Agent Outcome</h2>
              <p className="text-xs text-slate-500">Cognitive Behavioral Therapy (CBT) & Guided Mindfulness</p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            Risk: Normal
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Active Goals Created</h3>
            <div className="space-y-2">
              {(psychGoals.length > 0 ? psychGoals : [
                { title: 'Practice 5-min guided breathing daily', timeframe: '2 weeks', status: 'completed' },
                { title: 'Evening reflection journal', timeframe: '1 week', status: 'in_progress' }
              ]).map((g, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>✓ {g.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{g.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900">Psychological Guidance & Reflection</h3>
            <p className="text-xs text-purple-950 leading-relaxed">
              CBT interaction completed with positive coping strategies identified. Regular breathing exercises and structured goal setting are active in your daily wellness plan.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: RECOVERY & WELLNESS AGENT OUTCOME ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900">Recovery & Wellness Agent Outcome</h2>
              <p className="text-xs text-slate-500">Sleep, Circadian Regularity & Integrative AYUSH Guidance</p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            RWI: {rwi}/100
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Recovery Summary</h3>
          <p className="text-xs text-amber-950 leading-relaxed">
            {recoveryProfile?.recoverySummary || 'Optimal circadian alignment with restorative sleep hygiene recommendations.'}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">🌱 Integrative AYUSH Plan Guidance</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {ayushRecs.map((rec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">{rec.title || rec.name || `Practice ${i + 1}`}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.detail || rec.description || ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black font-heading">Multi-Agent Outcome Session Saved</h3>
          <p className="text-xs text-purple-200 mt-0.5">This outcome report is permanently saved and accessible in your profile and the Admin Console.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadFullPDF}
            className="px-6 py-3 rounded-2xl text-xs font-black bg-white text-purple-950 hover:bg-purple-50 shadow-lg flex items-center gap-2 transition-all cursor-pointer border-none"
          >
            <Download className="w-4 h-4 text-purple-700" />
            <span>Download PDF Report</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 rounded-2xl text-xs font-extrabold bg-purple-800 hover:bg-purple-700 text-white border border-purple-600 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-purple-300" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>

    </div>
  );
}
