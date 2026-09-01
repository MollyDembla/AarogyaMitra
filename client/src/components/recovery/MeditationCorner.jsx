import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Leaf, Play, Pause, Square, RotateCcw, Check, AlertCircle } from 'lucide-react';

// ── Practice Definitions ─────────────────────────────────────────────────────
const PRACTICES = [
  {
    id: 'quick-calm',
    name: 'Quick Calm',
    category: 'Stress Relief',
    duration: 2,
    color: 'from-violet-600 to-purple-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description: 'A very short practice to pause, reset, and find a moment of stillness in a busy day.',
    steps: [
      { duration: 20, instruction: 'Find a comfortable position. Gently close or soften your eyes.' },
      { duration: 30, instruction: 'Take three slow, natural breaths. With each exhale, let your shoulders drop a little.' },
      { duration: 30, instruction: 'Notice five things you can hear around you right now, without labeling them as good or bad. Just listen.' },
      { duration: 30, instruction: 'Bring your attention to the feeling of your body in contact with the seat or floor beneath you.' },
      { duration: 10, instruction: 'Take one final slow breath. Gently open your eyes and return to your surroundings.' }
    ]
  },
  {
    id: 'mindful-breathing',
    name: 'Mindful Breathing',
    category: 'Breath Awareness',
    duration: 5,
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    description: 'A focused breathing awareness practice to quiet mental chatter and anchor attention in the present moment.',
    steps: [
      { duration: 30, instruction: 'Settle comfortably. Relax your face, jaw, and shoulders.' },
      { duration: 30, instruction: 'Begin to notice your breath — not changing it, simply observing it. Notice where you feel it most clearly.' },
      { duration: 60, instruction: 'Count each exhale from 1 to 10, then restart. If your mind wanders, gently return to 1 — no judgment.' },
      { duration: 60, instruction: 'Now release the counting. Simply rest in the natural rhythm of breathing in and breathing out.' },
      { duration: 60, instruction: 'If thoughts arise, imagine them as clouds drifting past — you notice them, but you are the sky, not the cloud.' },
      { duration: 30, instruction: 'Slowly widen your awareness. Notice the room, sounds, sensations. Take a final slow breath and open your eyes.' }
    ]
  },
  {
    id: 'body-awareness',
    name: 'Body Awareness',
    category: 'Body Scan',
    duration: 7,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'A gentle body scan practice to release held tension and reconnect with physical sensations.',
    steps: [
      { duration: 30, instruction: 'Lie down or sit comfortably. Close your eyes. Take three deep, slow breaths.' },
      { duration: 60, instruction: 'Bring attention to the top of your head. Soften the scalp, forehead, and temples. Notice any warmth, tingling, or neutrality.' },
      { duration: 60, instruction: 'Move attention slowly down to your face, jaw, neck, and shoulders. With each exhale, allow a little more softness.' },
      { duration: 60, instruction: 'Continue to your chest and upper back. Notice the rise and fall with each breath.' },
      { duration: 60, instruction: 'Scan your arms, hands, and fingers. You may feel heaviness, warmth, or lightness — all are fine.' },
      { duration: 60, instruction: 'Move to your belly, hips, and lower back. Allow this entire area to soften and rest.' },
      { duration: 60, instruction: 'Scan your legs, knees, calves, feet, and toes. Let them be completely heavy and relaxed.' },
      { duration: 30, instruction: 'Now rest in a whole-body awareness. Take a slow breath and gently return to the room.' }
    ]
  },
  {
    id: 'guided-relaxation',
    name: 'Guided Relaxation',
    category: 'Deep Rest',
    duration: 10,
    color: 'from-indigo-600 to-blue-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    description: 'A longer, deeply restorative practice to calm the nervous system and guide the body toward genuine rest.',
    steps: [
      { duration: 30, instruction: 'Lie down if possible. Let your feet fall slightly apart. Place your hands gently on your belly or by your sides.' },
      { duration: 30, instruction: 'Take five slow, deep breaths. With each exhale, imagine releasing the day\'s tension.' },
      { duration: 60, instruction: 'Scan from head to toes, deliberately softening each area as you reach it. No rush.' },
      { duration: 90, instruction: 'Bring to mind a calm place — real or imagined. Perhaps a quiet natural setting. Notice the colors, sounds, and air.' },
      { duration: 90, instruction: 'As you rest in this place, feel a sense of safety. Breathe naturally. You have nowhere to be and nothing to do.' },
      { duration: 90, instruction: 'Let your mind become quieter. If thoughts come, simply return to the image of your calm place.' },
      { duration: 60, instruction: 'Begin to sense the boundary of your body again. Notice your breath becoming slightly fuller.' },
      { duration: 30, instruction: 'Slowly wiggle your fingers and toes. Take a deep breath. Return to wakefulness gently.' },
      { duration: 30, instruction: 'When you\'re ready, gently open your eyes. Remain still for a moment before moving.' }
    ]
  },
  {
    id: 'mindful-pause',
    name: 'Mindful Pause',
    category: 'Daily Practice',
    duration: 1,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    description: 'A 60-second pause to reset your attention and create a small island of calm in your day.',
    steps: [
      { duration: 15, instruction: 'Stop. Wherever you are. Just pause.' },
      { duration: 15, instruction: 'Take one slow, deliberate breath in through the nose.' },
      { duration: 15, instruction: 'Exhale slowly through the mouth. Let your shoulders drop.' },
      { duration: 15, instruction: 'Notice one thing you can see, hear, or feel right now. Simply acknowledge it.' }
    ]
  }
];

// ── Animated Progress Timer ──────────────────────────────────────────────────
function ProgressRing({ progress, color }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (1 - progress);

  return (
    <svg width="120" height="120" className="mx-auto">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="60" cy="60" r={r} fill="none" strokeWidth="8"
        strokeLinecap="round"
        stroke="url(#grad)"
        strokeDasharray={circumference}
        strokeDashoffset={dash}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function MeditationCorner({ onClose }) {
  const [view, setView] = useState('list'); // list | practice | complete
  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [reflection, setReflection] = useState(null);

  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const totalSeconds = selected ? selected.steps.reduce((a, s) => a + s.duration, 0) : 0;

  const startSession = useCallback(() => {
    if (!selected) return;
    setRunning(true);
    setPaused(false);
    setStepIdx(0);
    setStepElapsed(0);
    setTotalElapsed(0);
  }, [selected]);

  const stopSession = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPaused(false);
    setStepIdx(0);
    setStepElapsed(0);
    setTotalElapsed(0);
  }, [clearTimer]);

  useEffect(() => {
    if (!running || paused || !selected) { clearTimer(); return; }

    let localStepIdx = stepIdx;
    let localStepElapsed = stepElapsed;
    const tickMs = 500;

    intervalRef.current = setInterval(() => {
      localStepElapsed += tickMs / 1000;
      const currentStep = selected.steps[localStepIdx];

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
      setStepElapsed(localStepElapsed);

      if (localStepElapsed >= currentStep.duration) {
        localStepElapsed = 0;
        localStepIdx = Math.min(localStepIdx + 1, selected.steps.length - 1);
        setStepIdx(localStepIdx);
        setStepElapsed(0);
      }
    }, tickMs);

    return clearTimer;
  }, [running, paused, selected, stepIdx, stepElapsed, totalSeconds, clearTimer]);

  const totalProgress = totalSeconds > 0 ? totalElapsed / totalSeconds : 0;
  const stepProgress = selected ? stepElapsed / (selected.steps[stepIdx]?.duration || 1) : 0;
  const currentInstruction = selected?.steps[stepIdx]?.instruction || '';

  const remainingMin = Math.floor((totalSeconds - totalElapsed) / 60);
  const remainingSec = Math.floor((totalSeconds - totalElapsed) % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Leaf className="w-6 h-6 text-violet-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">Meditation & Mindfulness Corner</h2>
              <p className="text-xs text-slate-500">Independent wellness practice · Does not affect RWI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* ── View: Practice List ── */}
        {view === 'list' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Choose a Mindfulness Practice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRACTICES.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setView('practice'); }}
                  className={`text-left p-4 rounded-2xl border-2 ${p.border} ${p.bg} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${p.color} text-white`}>
                      {p.duration} min
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{p.category}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── View: Active Practice ── */}
        {view === 'practice' && selected && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => { stopSession(); setView('list'); }} className="text-sm text-slate-500 hover:text-slate-700">
                ← Back
              </button>
              <h3 className="font-bold text-slate-900">{selected.name}</h3>
              <div className="text-sm text-slate-500 font-mono">
                {remainingMin}:{String(remainingSec).padStart(2, '0')} left
              </div>
            </div>

            {/* Progress ring */}
            <div className="relative flex flex-col items-center gap-2">
              <ProgressRing progress={totalProgress} />
              <div className="text-xs text-slate-500 -mt-2">
                Step {stepIdx + 1} of {selected.steps.length}
              </div>
            </div>

            {/* Instruction card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-slate-800 text-base font-medium leading-relaxed">
                {currentInstruction}
              </p>
              {running && (
                <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-1 bg-gradient-to-r ${selected.color} rounded-full`}
                    style={{ width: `${stepProgress * 100}%`, transition: 'width 0.5s linear' }}
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {!running ? (
                <button
                  onClick={startSession}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r ${selected.color} text-white font-bold shadow-lg hover:shadow-xl transition-all`}
                >
                  <Play className="w-5 h-5" /> Begin Practice
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
                    <Square className="w-5 h-5" /> End
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── View: Complete ── */}
        {view === 'complete' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
              <Leaf className="w-10 h-10 text-violet-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">Practice Complete</h3>
              <p className="text-slate-600 mt-1">{selected?.name} · {selected?.duration} minutes</p>
              <p className="text-slate-500 text-sm mt-2 italic">Take a moment to notice how you feel.</p>
            </div>

            {!reflection ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 font-medium">How do you feel after this practice?</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {['More relaxed', 'About the same', 'Still stressed'].map(r => (
                    <button
                      key={r}
                      onClick={() => setReflection(r)}
                      className="px-4 py-2 bg-slate-100 hover:bg-violet-100 hover:text-violet-800 text-slate-700 rounded-xl text-sm font-medium border border-slate-200 hover:border-violet-300 transition-all"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-200 text-sm text-violet-800">
                You noted: <strong>{reflection}</strong>. This reflection is for your personal awareness only and is not used in your wellness scores.
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
                className="px-5 py-2.5 bg-violet-700 text-white rounded-xl font-bold hover:bg-violet-800 transition-all"
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
