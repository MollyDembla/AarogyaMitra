import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Wind, Play, Pause, Square, RotateCcw, Check, AlertCircle } from 'lucide-react';

// ── Breathing Exercise Definitions ───────────────────────────────────────────
const EXERCISES = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, and hold for equal counts. Used widely for stress regulation and focus.',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    durations: [3, 5, 8],
    difficulty: 'Beginner',
    color: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'A calming technique where exhale is twice as long as inhale, promoting relaxation.',
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    durations: [3, 5, 8],
    difficulty: 'Intermediate',
    color: 'from-violet-600 to-purple-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200'
  },
  {
    id: 'deep',
    name: 'Deep Belly Breathing',
    description: 'Slow diaphragmatic breathing to activate the parasympathetic nervous system.',
    pattern: { inhale: 5, holdIn: 2, exhale: 6, holdOut: 0 },
    durations: [3, 5, 10],
    difficulty: 'Beginner',
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200'
  },
  {
    id: 'relaxation',
    name: 'Slow Relaxation Breathing',
    description: 'Extended exhale breathing to deeply calm stress and prepare for rest.',
    pattern: { inhale: 4, holdIn: 0, exhale: 8, holdOut: 2 },
    durations: [5, 8, 12],
    difficulty: 'Beginner',
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200'
  }
];

const PHASES = ['inhale', 'holdIn', 'exhale', 'holdOut'];
const PHASE_LABELS = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Rest'
};

function BreathCircle({ phase, progress, exercise }) {
  const isExpanding = phase === 'inhale';
  const isShrinking = phase === 'exhale';
  const isHeld = phase === 'holdIn' || phase === 'holdOut';

  const scale = isExpanding ? 0.65 + 0.35 * progress
    : isShrinking ? 1.0 - 0.35 * progress
    : phase === 'holdIn' ? 1.0
    : 0.65;

  return (
    <div className="relative flex items-center justify-center w-52 h-52 mx-auto">
      {/* Outer pulse ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-blue-300/40"
        style={{
          transform: `scale(${scale * 1.15})`,
          transition: 'transform 0.3s ease-out',
          opacity: isHeld ? 0.4 : 0.7
        }}
      />
      {/* Main breath circle */}
      <div
        className={`absolute inset-6 rounded-full bg-gradient-to-br ${exercise.color} shadow-2xl flex items-center justify-center`}
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <Wind className="w-8 h-8 text-white/80" />
      </div>
    </div>
  );
}

export default function BreathingCorner({ onClose }) {
  const [view, setView] = useState('list'); // list | practice | complete
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState(5);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [reflection, setReflection] = useState(null);

  const intervalRef = useRef(null);
  const totalSeconds = duration * 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const getPhaseSeconds = useCallback((ex, ph) => {
    if (!ex) return 0;
    return ex.pattern[ph] || 0;
  }, []);

  const startSession = useCallback(() => {
    if (!selected) return;
    setRunning(true);
    setPaused(false);
    setPhase('inhale');
    setPhaseProgress(0);
    setPhaseCountdown(selected.pattern.inhale);
    setTotalElapsed(0);
  }, [selected]);

  const stopSession = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPaused(false);
    setPhase('inhale');
    setPhaseProgress(0);
    setTotalElapsed(0);
  }, [clearTimer]);

  // Tick logic
  useEffect(() => {
    if (!running || paused || !selected) {
      clearTimer();
      return;
    }

    const patternPhases = PHASES.filter(p => getPhaseSeconds(selected, p) > 0);
    let currentPhaseIdx = patternPhases.indexOf(phase);
    let phaseSeconds = getPhaseSeconds(selected, phase);
    let elapsed = 0;
    let tickMs = 100;

    intervalRef.current = setInterval(() => {
      elapsed += tickMs / 1000;
      const progress = Math.min(elapsed / phaseSeconds, 1);
      const countdown = Math.max(0, Math.ceil(phaseSeconds - elapsed));

      setPhaseProgress(progress);
      setPhaseCountdown(countdown);
      setTotalElapsed(prev => {
        const next = prev + tickMs / 1000;
        if (next >= totalSeconds) {
          clearTimer();
          setRunning(false);
          setView('complete');
          return next;
        }
        return next;
      });

      if (elapsed >= phaseSeconds) {
        currentPhaseIdx = (currentPhaseIdx + 1) % patternPhases.length;
        const nextPhase = patternPhases[currentPhaseIdx];
        const nextSeconds = getPhaseSeconds(selected, nextPhase);
        elapsed = 0;
        phaseSeconds = nextSeconds;
        setPhase(nextPhase);
        setPhaseCountdown(nextSeconds);
        setPhaseProgress(0);
      }
    }, tickMs);

    return clearTimer;
  }, [running, paused, selected, phase, totalSeconds, clearTimer, getPhaseSeconds]);

  const progressPct = Math.min(100, (totalElapsed / totalSeconds) * 100);
  const remainingMin = Math.floor((totalSeconds - totalElapsed) / 60);
  const remainingSec = Math.floor((totalSeconds - totalElapsed) % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wind className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">Breathing Corner</h2>
              <p className="text-xs text-slate-500">Independent wellness practice · Does not affect RWI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Safety Banner */}
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>Stop immediately if you feel dizzy, lightheaded, or uncomfortable. These are gentle wellness practices, not medical treatments.</span>
        </div>

        {/* ── View: Exercise List ── */}
        {view === 'list' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Choose a Breathing Exercise</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXERCISES.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => { setSelected(ex); setDuration(ex.durations[0]); setView('practice'); }}
                  className={`text-left p-4 rounded-2xl border-2 ${selected?.id === ex.id ? ex.border + ' ' + ex.bg : 'border-slate-200 bg-slate-50'} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{ex.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${ex.color} text-white`}>
                      {ex.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{ex.description}</p>
                  <div className="flex gap-1 text-[10px] text-slate-500 font-mono">
                    {PHASES.filter(p => ex.pattern[p] > 0).map(p => (
                      <span key={p} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {PHASE_LABELS[p].split(' ')[0]} {ex.pattern[p]}s
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── View: Practice ── */}
        {view === 'practice' && selected && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => { stopSession(); setView('list'); }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                ← Back
              </button>
              <h3 className="font-bold text-slate-900">{selected.name}</h3>
              <div className="text-sm text-slate-500 font-mono">
                {remainingMin}:{String(remainingSec).padStart(2, '0')} left
              </div>
            </div>

            {/* Duration selector */}
            {!running && (
              <div className="flex gap-2 justify-center">
                <span className="text-xs text-slate-600 self-center font-medium">Duration:</span>
                {selected.durations.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${duration === d ? `bg-gradient-to-r ${selected.color} text-white shadow` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${selected.color} transition-all duration-1000`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Breath circle */}
            <BreathCircle phase={phase} progress={phaseProgress} exercise={selected} />

            {/* Phase Label + Countdown */}
            <div className="text-center space-y-1">
              <div className="text-2xl font-extrabold font-heading text-slate-800">
                {PHASE_LABELS[phase]}
              </div>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                {phaseCountdown}
              </div>
              <div className="text-xs text-slate-400">seconds</div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {!running ? (
                <button
                  onClick={startSession}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r ${selected.color} text-white font-bold shadow-lg hover:shadow-xl transition-all`}
                >
                  <Play className="w-5 h-5" /> Start
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setPaused(p => !p)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-100 text-amber-800 font-bold hover:bg-amber-200 transition-all"
                  >
                    {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopSession}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-all"
                  >
                    <Square className="w-5 h-5" /> Stop
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── View: Complete ── */}
        {view === 'complete' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">Session Complete</h3>
              <p className="text-slate-600 mt-1">{duration} minutes of {selected?.name}</p>
            </div>

            {!reflection ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 font-medium">Take a moment to notice how you feel. How do you feel now?</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {['Much more relaxed', 'Somewhat calmer', 'About the same', 'Still restless'].map(r => (
                    <button
                      key={r}
                      onClick={() => setReflection(r)}
                      className="px-4 py-2 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 rounded-xl text-sm font-medium border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-800">
                You noted: <strong>{reflection}</strong>. Thank you for reflecting — this is for your personal awareness only.
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => { stopSession(); setView('list'); setReflection(null); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Try Another
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
