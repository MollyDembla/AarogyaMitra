import React, { useState } from 'react';
import logoImg from '../assets/AarogyaMitra logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, Flower2 } from 'lucide-react';
import api from '../services/api';

const RULES = [
  { label: 'At least 6 characters', test: p => p.length >= 6 },
  { label: 'Contains a number',     test: p => /\d/.test(p) },
  { label: 'Contains a letter',     test: p => /[a-zA-Z]/.test(p) },
];

export default function SignUpPage({ onLoginSuccess }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        onLoginSuccess(res.data.user);
        navigate('/assessment');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#faf7f4' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 px-14 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2a1349 0%, #3d1f6e 55%, #572f96 100%)' }}>
        <div className="orb w-64 h-64 -top-10 -right-10"
          style={{ background: 'radial-gradient(circle, #8b62d9, transparent)', opacity: 0.4 }} />
        <div className="orb w-48 h-48 bottom-16 -left-8"
          style={{ background: 'radial-gradient(circle, #c9b3f5, transparent)', opacity: 0.3 }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img src={logoImg} alt="AarogyaMitra" className="h-10 object-contain bg-white px-3 py-1.5 rounded-xl shadow-md" />
        </div>

        {/* Body */}
        <div className="space-y-6 relative z-10">
          <div className="w-12 h-1 rounded-full" style={{ background: '#9f7dd4' }} />
          <h2 className="text-4xl font-extrabold font-heading text-white leading-tight">
            Begin your<br />wellness<br />
            <span style={{ color: '#c9b3f5' }}>journey today.</span>
          </h2>
          <p style={{ color: 'rgba(201,179,245,0.65)' }} className="text-sm leading-relaxed max-w-xs">
            Join thousands who understand their well-being through science-backed AI guidance.
          </p>

          <div className="space-y-2.5">
            {[
              'WHO-5, PSS-10, GAD-7 & PHQ-9 screening',
              'AI-powered personalized wellness report',
              'Specialist agent guidance & recommendations',
              '100% non-diagnostic & privacy-focused',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#9f7dd4' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* Affirmation */}
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,179,245,0.15)' }}>
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9b3f5' }} />
            <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              "Self-awareness is the first step to meaningful change."
            </p>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'rgba(201,179,245,0.3)' }}>
          © {new Date().getFullYear()} AarogyaMitra
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-7">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6b3fb0, #3d1f6e)' }}>
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading" style={{ color: '#2a1349' }}>AarogyaMitra</span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold font-heading" style={{ color: '#2a1349' }}>Create Account</h1>
            <p className="text-sm mt-1.5 text-slate-500">Free forever — no credit card required</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm section-enter">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'signup-first', k: 'firstName', label: 'First Name', ph: 'Aarav' },
                { id: 'signup-last',  k: 'lastName',  label: 'Last Name',  ph: 'Sharma' },
              ].map(({ id, k, label, ph }) => (
                <div key={k} className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-purple-700">{label}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9f7dd4' }} />
                    <input id={id} type="text" required value={form[k]} onChange={set(k)} placeholder={ph}
                      className="input-field" style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-purple-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9f7dd4' }} />
                <input id="signup-email" type="email" required value={form.email} onChange={set('email')}
                  placeholder="you@example.com" className="input-field" style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-purple-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9f7dd4' }} />
                <input id="signup-password" type={showPwd ? 'text' : 'password'} required minLength={6}
                  value={form.password} onChange={set('password')} placeholder="Min. 6 characters"
                  className="input-field pr-11" style={{ paddingLeft: '2.75rem' }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password hints */}
              {form.password.length > 0 && (
                <div className="flex gap-3 flex-wrap pt-1">
                  {RULES.map(r => (
                    <div key={r.label} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.test(form.password) ? 'bg-emerald-500' : 'bg-purple-200'}`} />
                      <span className={`text-[10px] ${r.test(form.password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Creating Account…
                </span>
              ) : 'Get Started Free'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-purple-700 hover:text-purple-900">Sign in</Link>
          </p>

          <p className="text-center text-xs text-slate-400 leading-relaxed">
            By signing up, you acknowledge that AarogyaMitra is a wellness screening tool and does not provide clinical diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
}
