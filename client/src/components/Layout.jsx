import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HeartPulse, Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import logoImg from '../assets/AarogyaMitra logo.png';

// Pages where we show the public top navbar (no sidebar)
const PUBLIC_PAGES = ['/', '/login', '/signup'];
// Pages where we show full-bleed layout (no navbar, no sidebar)
const FULL_BLEED = ['/login', '/signup'];
// Onboarding pages where user must complete assessment (no sidebar, clean header with logo + logout)
const ONBOARDING_PAGES = ['/onboarding', '/assessment', '/assessment-progress'];

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@aarogyamitra.com' || location.pathname.startsWith('/admin');
  const isPublic = PUBLIC_PAGES.includes(location.pathname);
  const isFullBleed = FULL_BLEED.includes(location.pathname);
  const isOnboarding = !isAdmin && ONBOARDING_PAGES.includes(location.pathname);
  const isAuthenticated = !!user || isAdmin;

  // Onboarding Assessment Layout (no sidebar, clean focused header for standard users only)
  if (isAuthenticated && isOnboarding) {

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#faf7f4' }}>
        <header className="h-16 flex items-center justify-between px-6 sm:px-10 border-b bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm"
          style={{ borderColor: '#ede5f7' }}>
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="AarogyaMitra" className="h-9 object-contain" />
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Onboarding Screening
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-purple-50" style={{ borderColor: '#ede5f7' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #9f7dd4, #6b3fb0)' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span className="text-xs font-semibold text-purple-800">
                {user?.firstName}
              </span>
            </div>
            <button
              onClick={(e) => {
                if (e) e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('adminToken');
                if (onLogout) onLogout();
                window.location.href = '/login';
              }}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 text-center text-[11px]" style={{ color: 'rgba(107,63,176,0.45)' }}>
          AarogyaMitra · Initial Onboarding Assessment · Non-diagnostic wellness platform
        </footer>
      </div>
    );
  }

  // Authenticated: sidebar layout
  if (isAuthenticated && !isPublic) {
    return (
      <div className="flex min-h-screen" style={{ background: '#f5f0fb' }}>
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top slim header for authenticated sidebar layout */}
          <header className="h-14 flex items-center justify-between px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30"
            style={{ borderColor: '#ede5f7' }}>
            <div />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ background: '#f5f0fb', borderColor: '#ede5f7' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #9f7dd4, #6b3fb0)' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className="text-xs font-semibold text-purple-800">
                  {user?.firstName}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <footer className="py-4 px-6 text-center text-[11px]" style={{ color: 'rgba(107,63,176,0.45)' }}>
            AarogyaMitra · Non-diagnostic wellness platform · Not a substitute for professional medical advice
          </footer>
        </div>
      </div>
    );
  }

  // Public full-bleed (login / signup)
  if (isFullBleed) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#faf7f4' }}>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Public landing page with top navbar
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#faf7f4' }}>
      {/* Public Top Navbar */}
      <PublicNav user={user} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

function PublicNav({ user }) {
  const NAV_LINKS = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Our Approach', href: '#approach' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md"
      style={{ borderColor: '#ede5f7' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <RouterLink to="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="AarogyaMitra" className="h-9 object-contain" />
          </RouterLink>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm font-medium transition-colors"
                style={{ color: '#64748b' }}
                onMouseEnter={e => e.target.style.color = '#6b3fb0'}
                onMouseLeave={e => e.target.style.color = '#64748b'}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <RouterLink to="/login"
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all"
              style={{ color: '#6b3fb0' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f0fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Sign In
            </RouterLink>
            <RouterLink to="/signup" className="btn-primary text-sm px-5 py-2.5">
              Get Started
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

function PublicFooter() {
  return (
    <footer style={{ background: '#2a1349', borderTop: '1px solid rgba(139,98,217,0.2)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="AarogyaMitra" className="h-9 object-contain bg-white px-2 py-1 rounded-lg" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(201,179,245,0.65)' }}>
              Your Intelligent Companion for Holistic Well-Being. Science-backed wellness screening powered by Agentic AI.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(201,179,245,0.4)' }}>Platform</p>
            {[['Get Started', '/signup'], ['Sign In', '/login']].map(([l, p]) => (
              <RouterLink key={p} to={p}
                className="block text-sm transition-colors"
                style={{ color: 'rgba(201,179,245,0.6)' }}
                onMouseEnter={e => e.target.style.color = 'rgba(201,179,245,1)'}
                onMouseLeave={e => e.target.style.color = 'rgba(201,179,245,0.6)'}>
                {l}
              </RouterLink>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(201,179,245,0.4)' }}>Legal</p>
            {['Privacy', 'Terms', 'Safety'].map(l => (
              <a key={l} href="#"
                className="block text-sm transition-colors"
                style={{ color: 'rgba(201,179,245,0.6)' }}
                onMouseEnter={e => e.target.style.color = 'rgba(201,179,245,1)'}
                onMouseLeave={e => e.target.style.color = 'rgba(201,179,245,0.6)'}>
                {l}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(139,98,217,0.15)' }}>
          <p className="text-xs" style={{ color: 'rgba(201,179,245,0.35)' }}>
            © {new Date().getFullYear()} AarogyaMitra
          </p>
          <p className="text-xs text-center" style={{ color: 'rgba(201,179,245,0.35)' }}>
            Non-diagnostic wellness platform. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
