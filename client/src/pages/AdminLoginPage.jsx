import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import api from '../services/api';
import logoImg from '../assets/AarogyaMitra logo.png';

export default function AdminLoginPage({ onAdminLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.success && res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
        if (onAdminLoginSuccess) onAdminLoginSuccess(res.data.admin);
        navigate('/admin');
      } else {
        setError(res.message || 'Admin authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@aarogyamitra.com');
    setPassword('Admin@Aarogya2026!');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: '#faf7f4' }}>
      <div className="max-w-md w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-3 section-enter">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            Control Room Access
          </div>
          <div className="flex justify-center">
            <img src={logoImg} alt="AarogyaMitra" className="h-12 object-contain" />
          </div>
          <h2 className="text-2xl font-black font-heading text-purple-900">
            Admin Portal Login
          </h2>
          <p className="text-xs text-purple-600 max-w-xs mx-auto">
            Authorized Administrator Portal for User Management, Agent Execution History, and LangGraph Engine Monitoring.
          </p>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl border border-purple-100 shadow-xl space-y-6 section-enter">

          {/* Quick Fill Banner */}
          <div className="bg-purple-50/90 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-semibold">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Default Admin Account</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              Quick Fill
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aarogyamitra.com"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-sm mt-2 font-bold"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-purple-100 text-center">
            <Link to="/login" className="text-xs font-semibold text-purple-600 hover:text-purple-900 transition-colors">
              ← Return to Standard User Login
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
