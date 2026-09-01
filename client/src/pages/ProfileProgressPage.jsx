import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Activity, History, Save, CheckCircle2, TrendingUp, Brain, Moon, Shield, BarChart2, Edit3, X, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { useWellness } from '../context/WellnessContext';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'progress', label: 'My Progress', icon: TrendingUp }
];

export default function ProfileProgressPage({ user: currentUser }) {
  const { mmwbi, domainScores, wellnessData, refresh } = useWellness();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [profileChanged, setProfileChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    age: '', gender: 'male', height: '', weight: '', education: '', occupation: '', workPattern: 'Sedentary'
  });

  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      try {
        const [resProf, resHist] = await Promise.allSettled([
          api.get('/profile'),
          api.get('/assessment/history')
        ]);

        if (resProf.status === 'fulfilled' && resProf.value?.success) {
          setProfile(resProf.value.data);
          const d = resProf.value.data;
          setFormData({
            age: d.age || '',
            gender: d.gender || '',
            height: d.height || '',
            weight: d.weight || '',
            education: d.education || '',
            occupation: d.occupation || '',
            workPattern: d.workPattern || ''
          });
        }

        if (resHist.status === 'fulfilled' && resHist.value?.success) {
          setHistory(resHist.value.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndHistory();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setProfileChanged(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.put('/profile', formData);
      if (res.success) {
        setProfile(res.data);
        setSuccessMsg('Profile updated successfully!');
        setProfileChanged(false);
        setIsEditing(false);
        refresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all";
  const inputStyle = { borderColor: '#e2e8f0' };
  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5";
  const labelStyle = { color: '#64748b' };

  if (loading) {
    return <div className="py-12 text-center text-sm" style={{ color: '#9f7dd4' }}>Loading your profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border"
        style={{ background: 'white', borderColor: '#ede5f7' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
            <span className="text-2xl font-black text-white">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black font-heading" style={{ color: '#1a0b35' }}>
              {currentUser?.firstName} {currentUser?.lastName}
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>{currentUser?.email}</p>
            {mmwbi && (
              <p className="text-xs mt-0.5 font-semibold" style={{ color: '#9f7dd4' }}>
                MMWBI: {mmwbi?.toFixed(0)}/100
              </p>
            )}
          </div>
        </div>

        <Link
          to="/assessment"
          className="btn-primary text-xs px-4 py-2.5 flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Retake Wellness Assessment
        </Link>
      </div>

      {/* Reassessment banner */}
      {profileChanged && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border"
          style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          <span className="text-sm font-semibold">⚠️ Profile changes may affect your wellness assessment. Consider retaking the assessment after saving.</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border text-sm"
          style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === id ? 'white' : 'transparent',
              color: activeTab === id ? '#6b3fb0' : '#64748b',
              boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
            }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Info - View or Edit */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>
                Personal Demographics
              </h2>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Add Details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              /* Read-only Profile Details View */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Age</span>
                    <span className="text-sm font-bold text-slate-800">{formData.age || 'Not added'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gender</span>
                    <span className="text-sm font-bold text-slate-800 capitalize">{formData.gender || 'Not added'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Height</span>
                    <span className="text-sm font-bold text-slate-800">{formData.height ? `${formData.height} cm` : 'Not added'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Weight</span>
                    <span className="text-sm font-bold text-slate-800">{formData.weight ? `${formData.weight} kg` : 'Not added'}</span>
                  </div>
                </div>

                {profile?.bmi && (
                  <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-900">Calculated Body Mass Index (BMI)</span>
                    <span className="text-base font-black text-purple-700">{profile.bmi}</span>
                  </div>
                )}

                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-500 font-medium">Education</span>
                    <span className="font-semibold text-slate-800">{formData.education || 'Not added'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-500 font-medium">Occupation</span>
                    <span className="font-semibold text-slate-800">{formData.occupation || 'Not added'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-500 font-medium">Work Pattern</span>
                    <span className="font-semibold text-slate-800">{formData.workPattern || 'Not added'}</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Update Details
                  </button>
                </div>
              </div>
            ) : (
              /* Editable Profile Form */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>Age</label>
                    <input type="number" value={formData.age} onChange={e => handleChange('age', e.target.value)}
                      placeholder="e.g. 25" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Gender</label>
                    <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)}
                      className={inputCls} style={inputStyle}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>Height (cm)</label>
                    <input type="number" value={formData.height} onChange={e => handleChange('height', e.target.value)}
                      placeholder="e.g. 170" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Weight (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => handleChange('weight', e.target.value)}
                      placeholder="e.g. 68" className={inputCls} style={inputStyle} />
                  </div>
                </div>

                {profile?.bmi && (
                  <div className="p-3 rounded-lg text-xs font-semibold" style={{ background: '#f5f0fb', color: '#6b3fb0' }}>
                    Calculated BMI: <strong>{profile.bmi}</strong>
                  </div>
                )}

                <div>
                  <label className={labelCls} style={labelStyle}>Education</label>
                  <input value={formData.education} onChange={e => handleChange('education', e.target.value)}
                    placeholder="e.g. Undergraduate" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Occupation</label>
                  <input value={formData.occupation} onChange={e => handleChange('occupation', e.target.value)}
                    placeholder="e.g. Software Engineer" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Work Pattern</label>
                  <select value={formData.workPattern} onChange={e => handleChange('workPattern', e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {['Sedentary', 'Physically active', 'Hybrid', 'Shift-based', 'Student', 'Other'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="btn-ghost text-xs px-4 py-2.5">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Wellness Summary from Context */}
          <div className="space-y-4">
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-base font-heading border-b pb-2" style={{ color: '#1a0b35', borderColor: '#f1f5f9' }}>
                Wellness Summary
              </h2>
              {mmwbi ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: '#64748b' }}>MMWBI</span>
                    <span className="font-black text-lg" style={{ color: '#6b3fb0' }}>{mmwbi?.toFixed(0)}/100</span>
                  </div>
                  {Object.entries(domainScores).map(([k, v]) => (
                    v ? (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: '#64748b' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-bold" style={{ color: '#1e293b' }}>{v?.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                          <div className="h-full rounded-full" style={{ width: `${v}%`, background: '#9f7dd4' }} />
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: '#94a3b8' }}>Complete your first assessment to see your wellness summary here.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Progress */}
      {activeTab === 'progress' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" style={{ color: '#6b3fb0' }} />
              <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Assessment History</h2>
            </div>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border flex items-center justify-between"
                    style={{ background: '#faf7fd', borderColor: '#ede5f7' }}>
                    <div>
                      <span className="font-bold text-sm block" style={{ color: '#2a1349' }}>
                        Assessment #{item.assessmentNumber || (history.length - idx)}
                      </span>
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        {new Date(item.completedAt || item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      {item.overallWellBeingScore && (
                        <span className="font-black text-lg" style={{ color: '#6b3fb0' }}>
                          {item.overallWellBeingScore?.toFixed(0)}
                        </span>
                      )}
                      <span className="text-[10px] block font-bold px-2 py-0.5 rounded-full mt-1"
                        style={{ background: '#f5f0fb', color: '#6b3fb0' }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: '#94a3b8' }}>No completed assessments recorded yet.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-6 space-y-3">
              <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Current Wellness Snapshot</h2>
              {mmwbi ? (
                <div className="space-y-3">
                  {[
                    { label: 'MMWBI', value: `${mmwbi?.toFixed(0)}/100`, icon: BarChart2, color: '#6b3fb0' },
                    { label: 'Assessments Completed', value: history.length, icon: CheckCircle2, color: '#16a34a' },
                    { label: 'Wellness Category', value: wellnessData?.result?.wellnessCategory || '—', icon: Activity, color: '#d97706' }
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 flex justify-between">
                        <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
                        <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: '#94a3b8' }}>Complete an assessment to see progress.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
