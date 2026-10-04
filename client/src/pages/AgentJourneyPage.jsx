import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Activity,
  Brain,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  GitFork,
  Play,
  UserCheck,
  AlertTriangle,
  FileText,
  Layers,
  Award
} from 'lucide-react';
import api from '../services/api';

export default function AgentJourneyPage() {
  const [journey, setJourney] = useState(null);
  const [graphState, setGraphState] = useState(null);
  const [topology, setTopology] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [journeyRes, topoRes] = await Promise.all([
          api.get('/journey/current').catch(() => ({ success: false })),
          api.get('/langgraph/topology').catch(() => ({ success: false }))
        ]);

        if (journeyRes.success && journeyRes.data) {
          setJourney(journeyRes.data);
        }
        if (topoRes.success && topoRes.data) {
          setTopology(topoRes.data);
        }
      } catch (err) {
        console.error('Error loading journey data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Trigger or step LangGraph execution live
  const handleRunLangGraph = async () => {
    setExecuting(true);
    try {
      const sid = sessionId || `lg_session_${Date.now()}`;
      const res = await api.post('/langgraph/run', { sessionId: sid });
      if (res.success && res.data) {
        setGraphState(res.data.state);
        setSessionId(res.data.sessionId);
        // Refresh journey
        const jRes = await api.get('/journey/current');
        if (jRes.success) setJourney(jRes.data);
      }
    } catch (err) {
      console.error('LangGraph execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 font-medium">Loading LangGraph agentic orchestrator state...</div>;
  }

  const activeAgentNode = graphState?.activeAgent || journey?.currentAgent || 'wellness_assessment';
  const completedNodes = graphState?.completedAgents || journey?.completedAgents || [];

  const getAgentRoute = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('physical')) return '/agent/physical-activity';
    if (n.includes('psychological') || n.includes('mental')) return '/agent/psychological-support';
    if (n.includes('professional') || n.includes('care')) return '/agent/professional-support';
    if (n.includes('recovery')) return '/agent/recovery-wellness';
    return '/agent/recovery-wellness';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Top Banner: LangGraph Multi-Agent Orchestrator */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-teal-700/40">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-800/80 rounded-2xl border border-teal-500/30 text-teal-300">
            <GitFork className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-400/20 text-teal-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-400/30 uppercase tracking-wider">
                LangGraph StateGraph Engine
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Active Multi-Agent Orchestration
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading mt-1">AarogyaMitra Agentic Graph Visualizer</h1>
            <p className="text-sm text-slate-300">Dynamic routing, shared state, reassessment loops & Human-In-The-Loop interrupts</p>
          </div>
        </div>

        <button
          onClick={handleRunLangGraph}
          disabled={executing}
          className="flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all text-sm whitespace-nowrap disabled:opacity-50"
        >
          {executing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-teal-950" />
              <span>Executing Graph Step...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Step / Execute LangGraph Workflow</span>
            </>
          )}
        </button>
      </div>

      {/* Human-In-The-Loop Interrupt Alert */}
      {graphState?.requiresUserAction && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-2xl flex items-start gap-4 text-amber-900">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-900 text-base">Human-In-The-Loop (HITL) Interruption Active</h3>
              <span className="text-xs bg-amber-200 text-amber-800 font-semibold px-2.5 py-1 rounded-full uppercase">
                Graph Paused
              </span>
            </div>
            <p className="text-sm text-amber-800">
              Action Required: <span className="font-semibold">{graphState.userActionType}</span>. The graph engine has safely paused for user input before proceeding to reassessment.
            </p>
            <div className="pt-2">
              <Link
                to={getAgentRoute(activeAgentNode)}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow transition-all"
              >
                Perform User Action Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Interactive LangGraph DAG Topology Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold font-heading text-slate-900">LangGraph StateGraph DAG Topology</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-teal-700">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span> Active Node
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Pending
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
            </span>
          </div>
        </div>

        {/* Graph Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(topology?.nodes || [
            { id: 'wellness_assessment', label: 'Wellness Assessment Agent', type: 'assessment' },
            { id: 'reasoning_router', label: 'Reasoning & Router Agent', type: 'router' },
            { id: 'recovery_wellness', label: 'Recovery & Wellness Agent', type: 'agent' },
            { id: 'physical_activity', label: 'Physical Activity Agent (HITL)', type: 'agent' },
            { id: 'psychological_support', label: 'Psychological Support (HITL)', type: 'agent' },
            { id: 'professional_care', label: 'Professional Support Pathway', type: 'agent' },
            { id: 'reassessment', label: 'Reassessment Loop Engine', type: 'loop' },
            { id: 'wellness_plan', label: 'Wellness Plan Synthesizer', type: 'terminal' }
          ]).map((node) => {
            const isActive = activeAgentNode === node.id || journey?.currentAgent === node.label;
            const isCompleted = completedNodes.some(c => c.toLowerCase().includes(node.id.replace('_', ' ')) || c === node.label);

            let borderStyle = 'border-slate-200 bg-slate-50 text-slate-700';
            if (isActive) {
              borderStyle = 'border-teal-500 bg-teal-900 text-white shadow-lg ring-2 ring-teal-400 ring-offset-2';
            } else if (isCompleted) {
              borderStyle = 'border-emerald-300 bg-emerald-50/70 text-emerald-900';
            }

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${borderStyle}`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-teal-400 text-teal-950 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    ACTIVE
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider opacity-75">
                    {node.type}
                  </span>
                  <h4 className="font-bold text-sm font-heading mt-0.5 line-clamp-2">{node.label}</h4>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-current/10">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 font-semibold text-teal-300">
                      <RotateCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Waiting</span>
                  )}

                  {node.type === 'agent' && (
                    <Link
                      to={getAgentRoute(node.label)}
                      className={`text-[11px] font-bold hover:underline ${isActive ? 'text-teal-300' : 'text-teal-700'}`}
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Agent Highlight Card */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-8 rounded-2xl shadow-xl space-y-6 border border-teal-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-teal-800/80 rounded-2xl border border-teal-600/30 text-teal-300">
              <Compass className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">Orchestrator Routing Decision</span>
              <h2 className="text-2xl font-bold font-heading">
                {graphState?.routerDecision?.targetAgent || journey?.currentAgent || 'Recovery and Wellness Agent'}
              </h2>
            </div>
          </div>

          <Link
            to={getAgentRoute(graphState?.routerDecision?.targetAgent || journey?.currentAgent)}
            className="hidden md:inline-flex items-center gap-2 bg-teal-400 text-teal-950 hover:bg-teal-300 font-semibold px-6 py-3 rounded-xl shadow transition-all text-sm"
          >
            Enter Agent Module
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-teal-950/60 p-4 rounded-xl border border-teal-800/40 space-y-2 text-sm text-slate-200">
          <p className="font-semibold text-teal-300 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Router Reasoning:
          </p>
          <p className="leading-relaxed">
            {graphState?.routerDecision?.reasoning || journey?.recommendationReason || 'Evaluating graph state to route to next agent.'}
          </p>
        </div>
      </div>

      {/* Shared Graph State & Reassessment Loop Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Inspector */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Shared Graph State
            </h3>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Session: {graphState?.sessionId?.substring(0, 14) || 'active'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Risk Level:</span>
              <span className="font-bold text-slate-900">{graphState?.riskLevel || 'MODERATE'}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">MMWBI Score:</span>
              <span className="font-bold text-teal-700">{graphState?.mmwbi ? `${graphState.mmwbi} / 100` : 'Evaluated'}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Completed Agents:</span>
              <span className="font-bold text-emerald-700">{completedNodes.length} modules</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Reassessment Loop Count:</span>
              <span className="font-bold text-purple-700">{graphState?.reassessmentCount || 0} iterations</span>
            </div>
          </div>
        </div>

        {/* Dynamic Plan Synthesizer Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Synthesized Wellness Plan
          </h3>

          {graphState?.wellnessPlan ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cohesive Plan Generated!
                </span>
                <p className="text-slate-700 leading-relaxed mt-1">
                  {graphState.wellnessPlan.synthesisNarrative?.substring(0, 140)}...
                </p>
              </div>
              <div className="text-slate-600">
                Total Synthesized Recommendations: <span className="font-bold text-slate-900">{graphState.wellnessPlan.allRecommendations?.length || 0}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
              Wellness plan synthesis node executes automatically once all required specialized agents finish evaluation and reassessment passes complete.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
