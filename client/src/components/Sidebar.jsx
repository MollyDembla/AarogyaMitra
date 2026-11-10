import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HeartPulse, LayoutDashboard, FileText, ClipboardList,
  Brain, Activity, Moon, Shield, TrendingUp, User,
  ChevronLeft, ChevronRight, LogOut, Sparkles, ChevronDown, ChevronUp,
  ShieldCheck, Users, Layers, Workflow, Server
} from 'lucide-react';
import logoImg from '../assets/AarogyaMitra logo.png';

const USER_NAV = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'My Wellness',
    icon: HeartPulse,
    children: [
      { label: 'My Report', path: '/report', icon: FileText }
    ]
  },
  {
    label: 'AI Support',
    icon: Brain,
    children: [
      { label: 'Recovery & Wellness', path: '/agent/recovery-wellness', icon: Moon },
      { label: 'Psychological Support', path: '/agent/psychological-support', icon: Brain },
      { label: 'Physical Activity', path: '/agent/physical-activity', icon: Activity }
    ]
  },
  {
    label: 'Progress',
    icon: TrendingUp,
    children: [
      { label: 'Wellness Trends', path: '/progress', icon: TrendingUp }
    ]
  },
  {
    label: 'Professional Care',
    icon: Shield,
    children: [
      { label: 'Care Recommendation', path: '/agent/professional-support', icon: Shield }
    ]
  },
  {
    label: 'Profile & Settings',
    path: '/profile',
    icon: User
  }
];

const ADMIN_NAV = [
  {
    label: 'Control Room Overview',
    path: '/admin',
    tab: 'overview',
    icon: LayoutDashboard
  },
  {
    label: 'User Directory & Tasks',
    path: '/admin',
    tab: 'users',
    icon: Users
  },
  {
    label: 'Global Execution Logs',
    path: '/admin',
    tab: 'logs',
    icon: Layers
  },
  {
    label: 'System Health & Services',
    path: '/admin',
    tab: 'health',
    icon: Server
  }
];

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ 'My Wellness': true, 'AI Support': false, 'Progress': false, 'Professional Care': false });

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@aarogyamitra.com' || location.pathname.startsWith('/admin');

  const toggleGroup = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  const isActive = (path) => location.pathname === path;
  const isGroupActive = (children) => children?.some(c => location.pathname === c.path);

  const activeNavItems = isAdmin ? ADMIN_NAV : USER_NAV;

  const handleLogoutClick = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/login';
  };

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 border-r transition-all duration-300 z-40"
      style={{
        width: collapsed ? '68px' : '240px',
        background: isAdmin
          ? 'linear-gradient(180deg, #18092c 0%, #25103f 60%, #150727 100%)'
          : 'linear-gradient(180deg, #1a0b35 0%, #2a1349 60%, #1e1040 100%)',
        borderRight: '1px solid rgba(139,98,217,0.2)'
      }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: 'rgba(139,98,217,0.2)' }}>
        {!collapsed && (
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 overflow-hidden">
            <img src={logoImg} alt="AarogyaMitra" className="h-8 max-w-[160px] object-contain bg-white px-2 py-1 rounded-lg shadow-sm" />
            {isAdmin && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-400 text-purple-950">
                Admin
              </span>
            )}
          </Link>
        )}
        {collapsed && (
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="mx-auto">
            <img src={logoImg} alt="AarogyaMitra" className="w-8 h-8 object-contain bg-white p-1 rounded-lg shadow-sm" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'rgba(201,179,245,0.6)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#c9b3f5'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,179,245,0.6)'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User / Admin Chip */}
      {!collapsed && (
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(139,98,217,0.15)' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
            style={{ background: isAdmin ? 'rgba(251,191,36,0.12)' : 'rgba(139,98,217,0.12)', border: isAdmin ? '1px solid rgba(251,191,36,0.25)' : 'none' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: isAdmin ? 'linear-gradient(135deg, #d97706, #78350f)' : 'linear-gradient(135deg, #9f7dd4, #6b3fb0)' }}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {isAdmin ? 'System Administrator' : `${user?.firstName} ${user?.lastName}`}
              </p>
              <p className="text-[10px] truncate" style={{ color: isAdmin ? '#fde68a' : 'rgba(201,179,245,0.6)' }}>
                {isAdmin ? (user?.email || 'admin@aarogyamitra.com') : user?.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {activeNavItems.map((item) => {
          if (item.path) {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-sm font-medium"
                style={{
                  background: active ? 'rgba(139,98,217,0.25)' : 'transparent',
                  color: active ? '#e2d5ff' : 'rgba(201,179,245,0.65)',
                  borderLeft: active ? '3px solid #9f7dd4' : '3px solid transparent'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(139,98,217,0.1)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          // Group with children (for standard users)
          const groupActive = isGroupActive(item.children);
          const isOpen = openGroups[item.label];

          return (
            <div key={item.label}>
              <button
                onClick={() => !collapsed && toggleGroup(item.label)}
                className="w-full flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-xl transition-all text-sm font-medium"
                style={{
                  background: groupActive ? 'rgba(139,98,217,0.15)' : 'transparent',
                  color: groupActive ? '#e2d5ff' : 'rgba(201,179,245,0.65)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,98,217,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = groupActive ? 'rgba(139,98,217,0.15)' : 'transparent'}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && (isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-50" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50" />)}
              </button>

              {/* Children */}
              {!collapsed && isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l space-y-0.5" style={{ borderColor: 'rgba(139,98,217,0.25)' }}>
                  {item.children.map(child => {
                    const childActive = isActive(child.path);
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-xs font-medium"
                        style={{
                          background: childActive ? 'rgba(139,98,217,0.25)' : 'transparent',
                          color: childActive ? '#e2d5ff' : 'rgba(201,179,245,0.55)'
                        }}
                        onMouseEnter={e => { if (!childActive) e.currentTarget.style.color = 'rgba(201,179,245,0.9)'; }}
                        onMouseLeave={e => { if (!childActive) e.currentTarget.style.color = 'rgba(201,179,245,0.55)'; }}
                      >
                        <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'rgba(139,98,217,0.2)' }}>
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-sm cursor-pointer"
          style={{ color: 'rgba(201,179,245,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff8a8a'; e.currentTarget.style.background = 'rgba(255,100,100,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,179,245,0.5)'; e.currentTarget.style.background = 'transparent'; }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
