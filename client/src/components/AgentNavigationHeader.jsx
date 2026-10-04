import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Moon,
  Activity,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Check,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useWellness } from '../context/WellnessContext';
import { AGENT_DEFINITIONS } from '../utils/agentPlanGenerator';
import api from '../services/api';

export default function AgentNavigationHeader({ activeKey, canProceed = true, cannotProceedReason }) {
  const navigate = useNavigate();
  const { wellnessData, agentPlan, currentPlanStep, nextPlanStep, refresh } = useWellness();
  const journeyId = wellnessData?.journey?._id;

  const [reassessing, setReassessing] = useState(false);
  const [reassessStepText, setReassessStepText] = useState('');

  // Render ONLY Completed Agents + Current Active Agent (Hide future pre-decided steps!)
  const displayPlan = agentPlan && agentPlan.length > 0 ? agentPlan : Object.values(AGENT_DEFINITIONS).filter(a => a.key !== 'professional-support');
  const visiblePlan = displayPlan.filter(s => s.isCompleted || s.key === activeKey);

  // If no step matched activeKey in visiblePlan, ensure current active key is included
  if (!visiblePlan.some(s => s.key === activeKey)) {
    const activeDef = displayPlan.find(s => s.key === activeKey) || AGENT_DEFINITIONS[activeKey];
    if (activeDef) visiblePlan.push(activeDef);
  }

  // Target next step evaluated from plan: strictly find the first uncompleted agent that is NOT the active page
  const targetNextStep = displayPlan.find(s => !s.isCompleted && s.key !== activeKey) || null;

  // Mark current agent completed and trigger LangGraph Re-assessment state flow
  const handleProceedToNext = async (targetAgent) => {
    if (!canProceed) return;
    setReassessing(true);
    setReassessStepText('Analyzing agent execution outputs & domain metrics...');

    try {
      const activeDef = AGENT_DEFINITIONS[activeKey];
      if (journeyId && activeDef) {
        await api.post('/journey/update', {
          journeyId,
          completedAgent: activeDef.fullName || activeDef.name,
          status: 'in_progress'
        });
      }

      setReassessStepText('Evaluating domain scores & executing LangGraph routing rules...');
      await new Promise(r => setTimeout(r, 900));

      if (refresh) await refresh();

      setReassessStepText('LangGraph State Re-assessment Complete! Routing to next optimal agent...');
      await new Promise(r => setTimeout(r, 700));

      if (targetAgent?.path) {
        navigate(targetAgent.path);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.warn('Journey transition warning:', err);
      if (targetAgent?.path) navigate(targetAgent.path);
      else navigate('/dashboard');
    } finally {
      setReassessing(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">

      {/* LangGraph Full-Screen Re-assessment Loading Modal */}
      {reassessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-purple-600/30 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-700 to-teal-500 flex items-center justify-center border-2 border-purple-400 shadow-lg">
                <RotateCcw className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-700/50">
                LangGraph State Orchestrator
              </span>
              <h3 className="text-xl font-black font-heading text-white">Re-assessing Graph State...</h3>
              <p className="text-xs text-purple-200 font-mono animate-pulse">{reassessStepText}</p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div className="bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 h-full rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Top Module Switcher Bar - Renders ONLY Completed Agents + Current Active Agent */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-max">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            Active Plan Node:
          </span>
          {(() => {
            const completedSteps = visiblePlan.filter(s => s.isCompleted);
            const lastVisitedKey = completedSteps.length > 0 ? completedSteps[completedSteps.length - 1].key : null;

            return visiblePlan.map((step, idx) => {
              const Icon = step.icon || Activity;
              const isActive = activeKey === step.key;
              const isCompleted = step.isCompleted;
              const isLastVisited = step.key === lastVisitedKey && !isActive;

              return (
                <button
                  key={step.key}
                  onClick={() => {
                    if (isActive) return;
                    if (isCompleted && step.path) {
                      navigate(step.path);
                      return;
                    }
                    if (canProceed) handleProceedToNext(step);
                  }}
                  disabled={!canProceed && !isActive && !isCompleted}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-sm text-white font-extrabold ring-2 ring-purple-300 ring-offset-1'
                      : isCompleted
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                  style={{
                    background: isActive ? step.color : undefined
                  }}
                >
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>

                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  )}
                  
                  <span>{step.name}</span>

                  {isLastVisited && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full border border-emerald-300">
                      Last Visited
                    </span>
                  )}
                </button>
              );
            });
          })()}
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </div>

      {/* Dynamic Guided Next Step Card */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-purple-700/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-700/40 rounded-xl text-purple-200 border border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">LangGraph State Orchestration</span>
              <span className="text-[9px] font-extrabold bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                Dynamic Node Re-assessment
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {targetNextStep ? `Next Recommended Node: ${targetNextStep.name}` : 'Active Step Complete — All Plan Steps Done!'}
            </h4>
            {targetNextStep?.reason && (
              <p className="text-xs text-purple-200/80 mt-0.5 line-clamp-1">
                {targetNextStep.reason}
              </p>
            )}
          </div>
        </div>

        {targetNextStep ? (
          canProceed ? (
            <button
              onClick={() => handleProceedToNext(targetNextStep)}
              className="btn-primary flex items-center gap-2 text-xs px-4 py-2.5 shadow-md whitespace-nowrap bg-purple-600 hover:bg-purple-500 text-white border-none cursor-pointer"
            >
              Proceed to {targetNextStep.name}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                disabled
                title={cannotProceedReason || 'Complete current step requirements to unlock'}
                className="flex items-center gap-2 text-xs px-4 py-2.5 shadow-sm whitespace-nowrap bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl font-bold cursor-not-allowed opacity-90"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{cannotProceedReason || 'Next Agent Locked'}</span>
              </button>
            </div>
          )
        ) : (
          <Link
            to="/dashboard"
            className="btn-primary flex items-center gap-2 text-xs px-4 py-2.5 shadow-md whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white border-none"
          >
            <Check className="w-4 h-4" /> Complete Journey on Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
