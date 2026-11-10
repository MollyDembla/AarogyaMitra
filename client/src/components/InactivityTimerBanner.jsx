import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, SkipForward, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

/**
 * InactivityTimerBanner — Monitors user inactivity on specialized agent pages.
 * Shows warning after 35 seconds of inactivity. If user remains inactive for 15s more,
 * automatically issues a skip command to LangGraph and moves to next agent!
 */
export default function InactivityTimerBanner({ agentName, sessionId, onSkipped }) {
  const [inactivityState, setInactivityState] = useState('active'); // 'active' | 'warning' | 'skipped'
  const [warningCountdown, setWarningCountdown] = useState(15);
  const lastActivityRef = useRef(Date.now());
  const checkTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Reset inactivity timer on user interaction
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    if (inactivityState === 'warning') {
      setInactivityState('active');
      setWarningCountdown(15);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));

    // Monitor inactivity every 3 seconds
    checkTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= 35000 && inactivityState === 'active') {
        setInactivityState('warning');
        setWarningCountdown(15);
      }
    }, 3000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [inactivityState]);

  // Handle 15s warning countdown
  useEffect(() => {
    if (inactivityState === 'warning') {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setWarningCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleAutoSkip('inactivity_timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [inactivityState]);

  const handleAutoSkip = async (reason = 'user_skipped') => {
    setInactivityState('skipped');
    try {
      if (sessionId) {
        await api.post(`/langgraph/session/${sessionId}/skip`, {
          agentName,
          reason
        });
      }
      if (onSkipped) onSkipped();
    } catch (err) {
      console.error('Error auto-skipping agent:', err);
    }
  };

  if (inactivityState === 'active') return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 section-enter">
      {inactivityState === 'warning' && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Inactivity Warning</p>
              <p className="text-xs text-amber-800">
                LangGraph will skip <strong>{agentName}</strong> and select the next agent in <strong>{warningCountdown}s</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTimer}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-sm"
            >
              Continue
            </button>
            <button
              onClick={() => handleAutoSkip('user_skipped')}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-all flex items-center gap-1"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>
        </div>
      )}

      {inactivityState === 'skipped' && (
        <div className="bg-purple-900 border-2 border-purple-400 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Agent step skipped. LangGraph is selecting the next agent...</span>
          </div>
        </div>
      )}
    </div>
  );
}
