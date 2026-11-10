import React, { useState } from 'react';
import logoImg from '../assets/AarogyaMitra logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, Flower2, ShieldCheck, KeyRound, User } from 'lucide-react';
import api from '../services/api';

const AFFIRMATIONS = [
  'You are taking a brave step towards understanding yourself.',
  'Every journey to wellness begins with a single step.',
  'Your mental health matters — always.',
  'Healing is not linear, and that is perfectly okay.',
  'You deserve care, rest, and peace of mind.',
];

export default function LoginPage({ onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

  const handleQuickFillAdmin = () => {
    setLoginMode('admin');
    setEmail('admin@aarogyamitra.com');
    setPassword('Admin@Aarogya2026!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMode === 'admin') {
        const res = await api.post('/admin/login', { email, password });
        if (res.success && res.data.token) {
          localStorage.setItem('adminToken', res.data.token);
          localStorage.setItem('token', res.data.token);
          if (onLoginSuccess) {
            onLoginSuccess({
              id: res.data.admin.id,
              email: res.data.admin.email,
              firstName: 'System',
              lastName: 'Admin',
              role: 'admin'
            });
          }
          navigate('/admin');
        } else {
          setError(res.message || 'Admin authentication failed.');
        }
      } else {
        const res = await api.post('/auth/login', { email, password });
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          if (onLoginSuccess) onLoginSuccess(res.data.user);
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#faf7f4' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 px-14 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2a1349 0%, #3d1f6e 55%, #572f96 100%)' }}>
        {/* Orbs */}
        <div className="orb w-72 h-72 -top-16 -right-16"
          style={{ background: 'radial-gradient(circle, #8b62d9, transparent)', opacity: 0.4 }} />
        <div className="orb w-48 h-48 bottom-10 -left-10"
          style={{ background: 'radial-gradient(circle, #c9b3f5, transparent)', opacity: 0.3 }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img src={logoImg} alt="AarogyaMitra" className="h-10 object-contain bg-white px-3 py-1.5 rounded-xl shadow-md" />
        </div>

        {/* Center content */}
        <div className="space-y-7 relative z-10">
          <div className="w-12 h-1 rounded-full" style={{ background: '#9f7dd4' }} />
          <h2 className="text-4xl font-extrabold font-heading text-white leading-tight">
            Welcome<br />back to your<br />
            <span style={{ color: '#c9b3f5' }}>safe space.</span>
          </h2>
          <p style={{ color: 'rgba(201,179,245,0.65)' }} className="text-sm leading-relaxed max-w-xs">
            AarogyaMitra uses validated scientific tools to help you understand your emotional, psychological, and lifestyle well-being.
          </p>

          {/* Affirmation */}
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,179,245,0.15)' }}>
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9b3f5' }} />
            <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              "{affirmation}"
            </p>
          </div>

          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,179,245,0.12)', border: '1px solid rgba(201,179,245,0.2)' }}>
              <Flower2 className="w-12 h-12" style={{ color: '#c9b3f5' }} />
            </div>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'rgba(201,179,245,0.3)' }}>
          © {new Date().getFullYear()} AarogyaMitra
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6b3fb0, #3d1f6e)' }}>
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading" style={{ color: '#2a1349' }}>AarogyaMitra</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-1.5 rounded-2xl bg-purple-100/70 border border-purple-200/80 flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setLoginMode('user'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                loginMode === 'user'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Login</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginMode('admin'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                loginMode === 'admin'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold font-heading" style={{ color: '#2a1349' }}>
              {loginMode === 'admin' ? 'Admin Portal Sign In' : 'Welcome back'}
            </h1>
            <p className="text-sm mt-1.5 text-slate-500">
              {loginMode === 'admin'
                ? 'Sign in with Administrator credentials to access control room & user logs'
                : 'Sign in to continue your wellness journey'}
            </p>
          </div>

          {/* Admin Quick Fill Banner */}
          {loginMode === 'admin' && (
            <div className="bg-purple-50/90 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs section-enter">
              <div className="flex items-center gap-2 text-purple-900 font-semibold">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Default Admin Account</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Fill Admin Credentials
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm section-enter">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-purple-700">
                {loginMode === 'admin' ? 'Admin Email Address' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: '#9f7dd4' }} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={loginMode === 'admin' ? "admin@aarogyamitra.com" : "you@example.com"}
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-widest text-purple-700">
                {loginMode === 'admin' ? 'Admin Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: '#9f7dd4' }} />
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-11 pr-12 text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPwd(v => !v);
                  }}
                  title={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 p-1.5 rounded-lg transition-all z-20 cursor-pointer border border-purple-100"
                  tabIndex="-1"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4 text-purple-700" /> : <Eye className="w-4 h-4 text-purple-500" />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {loginMode === 'admin' ? 'Authenticating Admin…' : 'Signing in…'}
                </span>
              ) : (
                loginMode === 'admin' ? 'Sign In as Administrator' : 'Sign In'
              )}
            </button>
          </form>

          {loginMode === 'user' ? (
            <p className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-purple-700 hover:text-purple-900">Create one free</Link>
            </p>
          ) : (
            <p className="text-center text-xs text-purple-600 font-semibold">
              Single Administrator credentials are required for Control Room access.
            </p>
          )}

          <p className="text-center text-xs text-slate-400 leading-relaxed">
            AarogyaMitra is a wellness screening tool and does not provide medical diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
}
