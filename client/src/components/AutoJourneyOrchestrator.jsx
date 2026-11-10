import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, ArrowRight, RefreshCw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const AGENT_ROUTE_MAP = {
  wellness_assessment: '/assessment',
  recovery_wellness: '/agent/recovery-wellness',
  physical_activity: '/agent/physical-activity',
  psychological_support: '/agent/psychological-support',
  professional_care: '/agent/professional-support',
  wellness_plan: '/agent-session-report'
};

const AGENT_LABELS = {
  wellness_assessment: 'Wellness Assessment Agent',
  recovery_wellness: 'Recovery & Wellness Agent',
  physical_activity: 'Physical Activity Agent (MoveNet)',
  psychological_support: 'Psychological Support Agent (CBT)',
  professional_care: 'Professional Care Navigation Agent',
  wellness_plan: 'Completed Multi-Agent Session Report'
};

export default function AutoJourneyOrchestrator({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeState, setActiveState] = useState(null);
  const [autoNavTarget, setAutoNavTarget] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  // Poll active session state every 4 seconds for non-admin users
  useEffect(() => {
    if (!user || user.role === 'admin' || user.email === 'admin@aarogyamitra.com') return;

    let isMounted = true;
    const checkActiveSession = async () => {
      try {
        const res = await api.get('/langgraph/session/active');
        if (res.success && res.data?.state && isMounted) {
          const state = res.data.state;
          setActiveState(state);

          const currentPath = location.pathname;
          const targetAgent = state.activeAgent || state.nextAction;

          if (targetAgent && AGENT_ROUTE_MAP[targetAgent]) {
            const targetRoute = AGENT_ROUTE_MAP[targetAgent];
            if (currentPath !== targetRoute && currentPath !== '/dashboard' && state.journeyStatus !== 'completed' && state.requiresUserAction) {
              setAutoNavTarget({
                agentKey: targetAgent,
                agentLabel: AGENT_LABELS[targetAgent] || targetAgent,
                route: targetRoute,
                reason: state.routerDecision?.reason || 'LangGraph selected highest priority deficit agent'
              });
            } else if (currentPath !== '/agent-session-report' && currentPath !== '/dashboard' && state.journeyStatus === 'completed') {
              setAutoNavTarget({
                agentKey: 'wellness_plan',
                agentLabel: 'Completed Multi-Agent Session Report',
                route: '/agent-session-report',
                reason: 'LangGraph marked all relevant areas addressed — journey complete!'
              });
            } else {
              setAutoNavTarget(null);
            }
          }
        }
      } catch (err) {
        // Silent error
      }
    };

    checkActiveSession();
    const interval = setInterval(checkActiveSession, 4000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user, location.pathname]);

  // Handle automatic navigation countdown
  useEffect(() => {
    if (autoNavTarget) {
      setCountdown(3);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            navigate(autoNavTarget.route);
            setAutoNavTarget(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoNavTarget, navigate]);

  if (!autoNavTarget) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full section-enter">
      <div className="glass p-4 rounded-2xl border-2 border-purple-400 shadow-2xl space-y-3 bg-purple-950 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Bot className="w-4 h-4 animate-bounce text-amber-400" />
            <span>Closed-Loop Orchestration</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-800 text-purple-200 text-[10px] font-bold">
            Auto-Nav in {countdown}s
          </span>
        </div>

        <div>
          <h4 className="text-sm font-black font-heading text-white">{autoNavTarget.agentLabel}</h4>
          <p className="text-[11px] text-purple-200 mt-1 line-clamp-2">
            <strong>Reason:</strong> {autoNavTarget.reason}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setAutoNavTarget(null)}
            className="text-[11px] font-semibold text-purple-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              navigate(autoNavTarget.route);
              setAutoNavTarget(null);
            }}
            className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-bold"
          >
            <span>Open Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
