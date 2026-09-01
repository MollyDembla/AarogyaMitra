import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, LayoutDashboard, Compass, User, LogOut, Menu, X } from 'lucide-react';

import logoImg from '../assets/AarogyaMitra logo.png';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard',     path: '/dashboard',  icon: LayoutDashboard },
    { label: 'Agent Journey', path: '/journey',     icon: Compass },
    { label: 'Profile',       path: '/profile',     icon: User },
  ];

  const handleLogout = () => { setOpen(false); onLogout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 bg-cream-100 border-b border-purple-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="AarogyaMitra" className="h-9 object-contain" />
          </Link>

          {/* Desktop nav — auth users */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ label, path, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link key={path} to={path}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      active
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Avatar chip */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #9f7dd4, #6b3fb0)' }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span className="text-xs font-semibold text-purple-800 pr-1">
                    {user.firstName}
                  </span>
                </div>

                <button onClick={handleLogout} title="Log out"
                  className="p-2 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>

                <button className="md:hidden p-2 rounded-full text-slate-500 hover:bg-purple-50"
                  onClick={() => setOpen(v => !v)}>
                  {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="text-sm font-semibold text-purple-700 hover:text-purple-900 px-4 py-2 rounded-full hover:bg-purple-50 transition-all">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && open && (
        <div className="md:hidden px-5 pb-4 pt-1 border-t border-purple-100 space-y-1 section-enter">
          {navItems.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === path
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-purple-50'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
