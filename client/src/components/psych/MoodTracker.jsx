import React, { useState } from 'react';
import { Heart, Zap, Battery, Plus, Check } from 'lucide-react';
import api from '../../services/api';

const EMOTION_TAGS = ['Anxious', 'Sad', 'Angry', 'Calm', 'Hopeful', 'Tired', 'Overwhelmed', 'Content', 'Lonely', 'Grateful', 'Frustrated', 'Peaceful'];

function Slider({ label, value, onChange, icon: Icon, color }) {
  const percentage = ((value - 1) / 9) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-semibold" style={{ color: '#475569' }}>{label}</span>
        </div>
        <span className="text-sm font-black w-8 text-right" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[10px]" style={{ color: '#94a3b8' }}>
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

export default function MoodTracker({ onLogged }) {
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [tags, setTags] = useState([]);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag) => setTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/psych/mood', {
        moodScore: mood, stressScore: stress, energyScore: energy,
        emotionalTags: tags, reflection
      });
      setSaved(true);
      onLogged?.({ mood, stress, energy, tags });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Mood log error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <Slider label="Mood" value={mood} onChange={setMood} icon={Heart} color="#7c3aed" />
        <Slider label="Stress" value={stress} onChange={setStress} icon={Zap} color="#dc2626" />
        <Slider label="Energy" value={energy} onChange={setEnergy} icon={Battery} color="#16a34a" />
      </div>

      {/* Emotion Tags */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: '#475569' }}>How are you feeling? (optional)</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_TAGS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
              style={{
                background: tags.includes(tag) ? '#f5f0fb' : 'white',
                color: tags.includes(tag) ? '#6b3fb0' : '#64748b',
                borderColor: tags.includes(tag) ? '#c9b3f5' : '#e2e8f0'
              }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Reflection */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: '#475569' }}>Quick reflection (optional)</p>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full px-3 py-2.5 rounded-xl border text-xs resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: '#e2e8f0', focusRingColor: '#c9b3f5', minHeight: '60px' }}
          rows={2}
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #6b3fb0, #9f7dd4)', color: 'white' }}>
        {saved ? <><Check className="w-4 h-4" /> Logged!</> : saving ? 'Saving...' : <><Plus className="w-4 h-4" /> Log Today's Mood</>}
      </button>
    </div>
  );
}
