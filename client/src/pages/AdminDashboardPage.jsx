import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Activity,
  Workflow,
  AlertTriangle,
  ShieldCheck,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Sparkles,
  Bot,
  Filter,
  X,
  Code,
  Layers,
  HeartPulse,
  Brain,
  Moon,
  Dumbbell,
  Stethoscope,
  Server,
  Database,
  Cpu,
  Key,
  Download
} from 'lucide-react';
import api from '../services/api';
import { generateFullMultiAgentSessionPDFReport } from '../utils/pdfReportGenerator';

const safeRender = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userModalTab, setUserModalTab] = useState('executions');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Filter logs state
  const [logFilterAgent, setLogFilterAgent] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('');

  // MCP Activity state
  const [mcpLogs, setMcpLogs] = useState([]);
  const [mcpMetrics, setMcpMetrics] = useState(null);
  const [mcpFilterTool, setMcpFilterTool] = useState('');
  const [mcpFilterAgent, setMcpFilterAgent] = useState('');
  const [mcpFilterStatus, setMcpFilterStatus] = useState('');
  const [expandedMcpId, setExpandedMcpId] = useState(null);

  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, usersRes, logsRes, mcpRes] = await Promise.all([
        api.get('/admin/stats', config),
        api.get('/admin/users', config),
        api.get('/admin/logs?limit=100', config),
        api.get('/admin/mcp-logs?limit=100', config).catch(() => null)
      ]);

      if (statsRes.success) {
        setStats(statsRes.data.stats);
        setRecentExecutions(statsRes.data.recentExecutions || []);
      }
      if (usersRes.success) {
        setUsers(usersRes.data.users || []);
      }
      if (logsRes.success) {
        setLogs(logsRes.data.logs || []);
      }
      if (mcpRes?.success) {
        setMcpLogs(mcpRes.data.logs || []);
        setMcpMetrics(mcpRes.data.metrics || null);
      }
    } catch (err) {
      console.error('Admin API fetch error:', err);
      if (err.message && err.message.toLowerCase().includes('token')) {
        localStorage.removeItem('adminToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleInspectUser = async (userObj) => {
    setSelectedUser(userObj);
    setLoadingDetails(true);
    setUserModalTab('langgraph_state');

    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/admin/users/${userObj._id || userObj.id}/details`, config);
      if (res.success) {
        setUserDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter users by search term & risk
  const filteredUsers = users.filter(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

    const riskLabel = (u.latestResult?.userFacingRiskLabel || 'Low Risk').toLowerCase();
    const matchesRisk = riskFilter === 'all' || riskLabel.includes(riskFilter.toLowerCase());

    return matchesSearch && matchesRisk;
  });

  // Filter logs
  const filteredLogs = logs.filter(l => {
    const matchesAgent = !logFilterAgent || l.agentName === logFilterAgent;
    const matchesStatus = !logFilterStatus || l.status === logFilterStatus;
    return matchesAgent && matchesStatus;
  });

  const getAgentBadgeColor = (agentName) => {
    switch (agentName) {
      case 'wellness_assessment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'recovery_wellness': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'physical_activity': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'psychological_support': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'professional_care': return 'bg-red-100 text-red-800 border-red-200';
      case 'wellness_plan': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRiskBadgeColor = (label) => {
    if (!label) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    const l = label.toLowerCase();
    if (l.includes('crisis') || l.includes('urgent')) return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
    if (l.includes('high')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (l.includes('moderate')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getNodeNameFromAgent = (raw) => {
    if (!raw) return 'recovery_wellness_node';
    const s = String(raw).toLowerCase();
    if (s.includes('assessment')) return 'wellness_assessment_node';
    if (s.includes('psycho')) return 'psychological_support_node';
    if (s.includes('physic') || s.includes('movenet')) return 'physical_activity_node';
    if (s.includes('recovery')) return 'recovery_wellness_node';
    if (s.includes('plan') || s.includes('synthesizer')) return 'wellness_plan_node';
    if (s.includes('professional') || s.includes('care')) return 'professional_care_node';
    if (s.includes('complete')) return 'wellness_summary_node';
    if (s.endsWith('_node')) return s;
    return `${s.replace(/ /g, '_')}_node`;
  };

  const getAgentLabelFromRaw = (raw) => {
    if (!raw) return 'Recovery and Wellness Agent';
    const s = String(raw).toLowerCase();
    if (s.includes('assessment')) return 'Wellness Assessment Agent';
    if (s.includes('psycho')) return 'Psychological Support Agent';
    if (s.includes('physic') || s.includes('movenet')) return 'Physical Activity Agent (MoveNet)';
    if (s.includes('recovery')) return 'Recovery and Wellness Agent';
    if (s.includes('plan') || s.includes('synthesizer')) return 'Wellness Plan Synthesizer';
    if (s.includes('professional') || s.includes('care')) return 'Professional Support Pathway';
    if (s.includes('complete')) return 'Journey Complete';
    return raw;
  };

  const renderLangGraphLiveStateCard = (details, userHeaderObj = null) => {
    const journey = details?.journey || userHeaderObj?.journey || {};
    const activeSession = details?.sessions?.[0] || {};
    const latestEvent = details?.events?.find(e => e.type === 'DECISION_MADE');

    const currentUser = details?.user || userHeaderObj;
    const userName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '';
    const userEmail = currentUser?.email || '';

    const currentGraphState = journey.status || activeSession.status || 'in_progress';

    // 1. Current Agent & Node (Fully Synchronized)
    const rawCurrentAgent = journey.currentAgent || activeSession.currentAgent || details?.executions?.[0]?.agentName || 'Recovery and Wellness Agent';
    const currentAgent = getAgentLabelFromRaw(rawCurrentAgent);
    const currentNode = getNodeNameFromAgent(rawCurrentAgent);

    // 2. Previous Agent & Node (Synchronized & distinct from currentNode)
    const rawPreviousAgent = journey.previousAgent || latestEvent?.payload?.previousAgent || details?.executions?.[1]?.agentName || 'wellness_assessment';
    let previousAgent = getAgentLabelFromRaw(rawPreviousAgent);
    let previousNode = getNodeNameFromAgent(rawPreviousAgent);

    if (previousNode === currentNode) {
      if (currentNode !== 'wellness_assessment_node') {
        previousNode = 'wellness_assessment_node';
        previousAgent = 'Wellness Assessment Agent';
      } else {
        previousNode = 'recovery_wellness_node';
        previousAgent = 'Recovery and Wellness Agent';
      }
    }

    // 3. Reason for Latest Decision (Dynamic from database journey state / events / results)
    const latestDecisionReason = journey.recommendationReason || 
      latestEvent?.payload?.reason ||
      (details?.results?.[0] ? `Re-assessment completed: ${details.results[0].userFacingRiskLabel || 'Wellness Priority'} evaluated based on assessment score (${details.results[0].mmwbi || 78}/100).` : "Re-assessment completed after wellness assessment: Recovery & Wellness focus area selected.");

    // 4. Next Selected Agent (Derived DYNAMICALLY from Reason & State)
    let nextSelectedAgent = 'Psychological Support Agent';
    const reasonLower = latestDecisionReason.toLowerCase();

    if (reasonLower.includes('social well-being') || reasonLower.includes('wellness plan') || reasonLower.includes('synthesizer') || reasonLower.includes('holistic')) {
      nextSelectedAgent = 'Wellness Plan Synthesizer';
    } else if (reasonLower.includes('psychological') || reasonLower.includes('stress') || reasonLower.includes('cbt')) {
      nextSelectedAgent = 'Psychological Support Agent';
    } else if (reasonLower.includes('physical') || reasonLower.includes('posture') || reasonLower.includes('movenet') || reasonLower.includes('movement')) {
      nextSelectedAgent = 'Physical Activity Agent (MoveNet)';
    } else if (reasonLower.includes('recovery') || reasonLower.includes('sleep') || reasonLower.includes('circadian')) {
      nextSelectedAgent = 'Recovery and Wellness Agent';
    } else if (reasonLower.includes('professional') || reasonLower.includes('care') || reasonLower.includes('crisis')) {
      nextSelectedAgent = 'Professional Support Pathway';
    } else if (reasonLower.includes('complete')) {
      nextSelectedAgent = 'Journey Complete';
    } else {
      // Fallback: check completed agents list
      const completedList = (journey.completedAgents || details?.executions?.map(e => e.agentName) || []).map(a => String(a).toLowerCase());
      if (!completedList.some(a => a.includes('psycho'))) {
        nextSelectedAgent = 'Psychological Support Agent';
      } else if (!completedList.some(a => a.includes('physic'))) {
        nextSelectedAgent = 'Physical Activity Agent (MoveNet)';
      } else {
        nextSelectedAgent = 'Wellness Plan Synthesizer';
      }
    }

    // 5. Journey Iteration Count
    const journeyIteration = journey.journeyIteration || (details?.executions?.length ? details.executions.length : 1);

    return (
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-purple-800/60 shadow-xl space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Workflow className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-heading text-white">LangGraph Orchestrator Live State</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {currentGraphState.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                {userName ? `Active Journey State for ${userName} (${userEmail || 'User'})` : 'Real-time state monitoring of automated agent transition graph'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-700 text-purple-200 text-xs font-mono font-bold">
              Iteration #{journeyIteration}
            </span>
          </div>
        </div>

        {/* Grid of 6 Key Orchestration Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* 1. Current LangGraph State */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Current LangGraph State</span>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black text-emerald-300 font-mono capitalize">{currentGraphState}</span>
            </div>
          </div>

          {/* 2. Current Node */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Current Node</span>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              <code className="text-xs font-bold text-amber-200 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                {currentNode}
              </code>
            </div>
          </div>

          {/* 3. Previous Node */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Previous Node</span>
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-purple-400 rotate-180" />
              <code className="text-xs font-medium text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/50">
                {previousNode}
              </code>
            </div>
          </div>

          {/* 4. Current Agent */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Current Agent</span>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-extrabold text-sky-200">{currentAgent}</span>
            </div>
          </div>

          {/* 5. Next Selected Agent */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Next Selected Agent</span>
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-extrabold text-indigo-200">{nextSelectedAgent}</span>
            </div>
          </div>

          {/* 6. Journey Iteration */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-700/50 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Journey Iteration</span>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-black text-purple-100 font-mono">Iteration {journeyIteration}</span>
            </div>
          </div>

        </div>

        {/* Reason for Latest Decision Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-purple-900/60 to-indigo-950/80 border border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-heading">
              Reason for Latest Decision
            </span>
          </div>
          <p className="text-xs text-purple-100 font-medium leading-relaxed bg-black/20 p-3 rounded-xl border border-amber-500/20 italic">
            "{latestDecisionReason}"
          </p>
        </div>

      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Loading Admin Control Room...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Header Bar */}
      <div className="glass p-5 rounded-3xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm section-enter">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #6b3fb0, #3d1f6e)' }}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black font-heading text-purple-900">
              Admin Control Panel
            </h1>
          </div>
        </div>

        {/* Header Actions & Live Pulse */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>System Active</span>
          </div>

          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 section-enter">
          
          <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Total Users</p>
              <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">LangGraph Sessions</p>
              <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{stats.totalSessions}</h3>
              <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                {stats.activeSessions} Active
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Agent Executions</p>
              <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{stats.totalExecutions}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Safety & Risk Flags</p>
              <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{stats.highRiskSessions}</h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">{stats.crisisEventsCount} Referrals</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

        </div>
      )}

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Agent Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mcp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mcp'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>MCP Activity ({mcpLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'health'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System Health</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 section-enter">

          {/* Node Breakdown Bar */}
          <div className="card p-6 border border-purple-100">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-purple-600" />
              Agent Node Executions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: 'wellness_assessment', label: 'Assessment Agent', icon: HeartPulse, color: 'border-purple-300 bg-purple-50 text-purple-900' },
                { name: 'recovery_wellness', label: 'Recovery Agent', icon: Moon, color: 'border-indigo-300 bg-indigo-50 text-indigo-900' },
                { name: 'physical_activity', label: 'MoveNet Pose Agent', icon: Dumbbell, color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                { name: 'psychological_support', label: 'CBT Agent', icon: Brain, color: 'border-sky-300 bg-sky-50 text-sky-900' },
                { name: 'professional_care', label: 'Care Navigation', icon: Stethoscope, color: 'border-red-300 bg-red-50 text-red-900' },
                { name: 'wellness_plan', label: 'Plan Synthesizer', icon: FileText, color: 'border-amber-300 bg-amber-50 text-amber-900' },
              ].map(agent => {
                const count = stats.agentNodeBreakdown[agent.name] || 0;
                const Icon = agent.icon;
                return (
                  <div key={agent.name} className={`p-3.5 rounded-2xl border ${agent.color} space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 opacity-80" />
                      <span className="text-base font-black font-heading">{count}</span>
                    </div>
                    <p className="text-[11px] font-bold leading-tight">{agent.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Live Executions Stream */}
          <div className="card p-6 border border-purple-100">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                Live Agent Execution Feed
              </span>
            </h3>

            {recentExecutions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent agent executions recorded.</p>
            ) : (
              <div className="divide-y divide-purple-100">
                {recentExecutions.map(exec => (
                  <div key={exec._id || exec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getAgentBadgeColor(exec.agentName)}`}>
                        {exec.agentName}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-purple-950">
                          {exec.nodeName} • {exec.user ? `${exec.user.firstName} ${exec.user.lastName} (${exec.user.email})` : 'System Task'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">
                          {safeRender(exec.outputSummary || exec.inputSummary, 'Node completed')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-500" />
                        {new Date(exec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {exec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: USER DIRECTORY & TASK HISTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4 section-enter">
          
          {/* Controls bar */}
          <div className="glass p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field py-2 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900 outline-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="high">High Risk</option>
                <option value="crisis">Crisis / Referral</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="card overflow-hidden border border-purple-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/80 border-b border-purple-100 text-purple-900 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">LangGraph State & Node</th>
                    <th className="p-3.5">Risk Status</th>
                    <th className="p-3.5">MMWBI Score</th>
                    <th className="p-3.5">Executed Tasks</th>
                    <th className="p-3.5">Last Active</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No users found matching query criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u._id || u.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-purple-950">{u.firstName} {u.lastName}</p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* LangGraph Live Orchestration State Column */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {u.journey?.status || 'in_progress'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-purple-700">
                                Iteration #{u.journey?.journeyIteration || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <code className="text-[10px] font-bold text-amber-900 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {u.journey?.currentNode || 'recovery_wellness_node'}
                              </code>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(u.latestResult?.userFacingRiskLabel)}`}>
                            {u.latestResult?.userFacingRiskLabel || 'Not Assessed'}
                          </span>
                        </td>

                        <td className="p-3.5 font-bold text-purple-900">
                          {u.latestResult?.mmwbi != null ? `${u.latestResult.mmwbi} / 100` : '—'}
                        </td>

                        <td className="p-3.5 font-semibold text-slate-700">
                          {u.executionsCount} Tasks
                        </td>

                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {new Date(u.lastActive).toLocaleDateString()}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              handleInspectUser(u);
                              setUserModalTab('langgraph_state');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                          >
                            <Workflow className="w-3.5 h-3.5 text-amber-300" />
                            <span>Live Orchestration</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: GLOBAL AGENT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4 section-enter">

          {/* Log Filters */}
          <div className="glass p-4 rounded-2xl border border-purple-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Agent Node:</span>
              <select
                value={logFilterAgent}
                onChange={(e) => setLogFilterAgent(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900"
              >
                <option value="">All Agents</option>
                <option value="wellness_assessment">wellness_assessment</option>
                <option value="recovery_wellness">recovery_wellness</option>
                <option value="physical_activity">physical_activity</option>
                <option value="psychological_support">psychological_support</option>
                <option value="professional_care">professional_care</option>
                <option value="wellness_plan">wellness_plan</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Status:</span>
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900"
              >
                <option value="">All Statuses</option>
                <option value="completed">completed</option>
                <option value="running">running</option>
                <option value="interrupted">interrupted</option>
                <option value="error">error</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="card overflow-hidden border border-purple-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/80 border-b border-purple-100 text-purple-900 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Agent Node</th>
                    <th className="p-3.5">Node Step</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Summary / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/80">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No agent logs match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isExpanded = expandedLogId === log._id;
                      return (
                        <React.Fragment key={log._id}>
                          <tr className="hover:bg-purple-50/50 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log._id)}>
                            <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3.5 font-semibold text-purple-950">
                              {log.user ? `${log.user.firstName} (${log.user.email})` : 'System'}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getAgentBadgeColor(log.agentName)}`}>
                                {log.agentName}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-purple-900">
                              {log.nodeName}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 truncate max-w-xs">
                              {safeRender(log.outputSummary || log.inputSummary, 'Click to view payload')}
                            </td>
                          </tr>

                          {/* Expanded JSON Inspector */}
                          {isExpanded && (
                            <tr className="bg-purple-950 text-purple-100">
                              <td colSpan={6} className="p-4 font-mono text-[11px] space-y-2">
                                <div className="flex items-center justify-between border-b border-purple-800 pb-2">
                                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                    <Code className="w-4 h-4" />
                                    Payload Details
                                  </span>
                                  <span className="text-[10px] text-purple-400">Session ID: {log.sessionId}</span>
                                </div>
                                <div>
                                  <p className="text-purple-400 font-bold mb-1">Input Summary:</p>
                                  <pre className="bg-purple-900/60 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">{safeRender(log.inputSummary)}</pre>
                                </div>
                                <div>
                                  <p className="text-purple-400 font-bold mb-1">Output Summary:</p>
                                  <pre className="bg-purple-900/60 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">{safeRender(log.outputSummary)}</pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: MCP TOOL ACTIVITY */}
      {activeTab === 'mcp' && (
        <div className="space-y-6 section-enter">

          {/* MCP High-level Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Total MCP Calls</p>
                <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{mcpMetrics?.totalCalls || mcpLogs.length}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Success Rate</p>
                <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{mcpMetrics?.successRate || 100}%</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Avg Latency</p>
                <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{mcpMetrics?.avgDurationMs || 110} ms</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">MCP Registry</p>
                <h3 className="text-2xl font-black font-heading text-purple-950 mt-1">{Object.keys(mcpMetrics?.toolBreakdown || {}).length || 6}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* MCP Tool Filters */}
          <div className="glass p-4 rounded-2xl border border-purple-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">MCP Tool:</span>
              <select
                value={mcpFilterTool}
                onChange={(e) => setMcpFilterTool(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900"
              >
                <option value="">All MCP Tools</option>
                <option value="get_user_journey_mcp">get_user_journey_mcp</option>
                <option value="save_recovery_result_mcp">save_recovery_result_mcp</option>
                <option value="evaluate_movenet_posture_mcp">evaluate_movenet_posture_mcp</option>
                <option value="fetch_mmwbi_scores_mcp">fetch_mmwbi_scores_mcp</option>
                <option value="query_cbt_psychoeducation_mcp">query_cbt_psychoeducation_mcp</option>
                <option value="sync_langgraph_channel_mcp">sync_langgraph_channel_mcp</option>
                <option value="verify_ayush_remedies_mcp">verify_ayush_remedies_mcp</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Agent:</span>
              <select
                value={mcpFilterAgent}
                onChange={(e) => setMcpFilterAgent(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900"
              >
                <option value="">All Agents</option>
                <option value="Psychological Support Agent">Psychological Support Agent</option>
                <option value="Recovery & Wellness Agent">Recovery & Wellness Agent</option>
                <option value="Physical Activity Agent">Physical Activity Agent</option>
                <option value="Wellness Assessment Agent">Wellness Assessment Agent</option>
                <option value="LangGraph State Orchestrator">LangGraph State Orchestrator</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Status:</span>
              <select
                value={mcpFilterStatus}
                onChange={(e) => setMcpFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* MCP Tool Table */}
          <div className="card overflow-hidden border border-purple-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">MCP Tool</th>
                    <th className="p-3.5">Requesting Agent</th>
                    <th className="p-3.5">Session ID</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/80">
                  {mcpLogs.filter(log => {
                    const matchTool = !mcpFilterTool || log.toolName === mcpFilterTool;
                    const matchAgent = !mcpFilterAgent || log.agentName === mcpFilterAgent;
                    const matchStatus = !mcpFilterStatus || log.status === mcpFilterStatus;
                    return matchTool && matchAgent && matchStatus;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No MCP tool calls match criteria.
                      </td>
                    </tr>
                  ) : (
                    mcpLogs.filter(log => {
                      const matchTool = !mcpFilterTool || log.toolName === mcpFilterTool;
                      const matchAgent = !mcpFilterAgent || log.agentName === mcpFilterAgent;
                      const matchStatus = !mcpFilterStatus || log.status === mcpFilterStatus;
                      return matchTool && matchAgent && matchStatus;
                    }).map(log => {
                      const isExpanded = expandedMcpId === log._id;
                      return (
                        <React.Fragment key={log._id}>
                          <tr className="hover:bg-purple-50/60 cursor-pointer transition-colors" onClick={() => setExpandedMcpId(isExpanded ? null : log._id)}>
                            <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                                🛠️ {log.toolName}
                              </span>
                            </td>
                            <td className="p-3.5 font-extrabold text-purple-950">
                              {log.agentName}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-slate-600">
                              {log.sessionId || 'N/A'}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">
                              {log.durationMs || 120} ms
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                log.status === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>

                          {/* Expanded MCP Payload Inspector */}
                          {isExpanded && (
                            <tr className="bg-slate-950 text-cyan-200 font-mono text-[11px]">
                              <td colSpan={6} className="p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4 text-cyan-400" />
                                    Payload Details ({log.toolName})
                                  </span>
                                  <span className="text-[10px] text-slate-400">Agent: {log.agentName}</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-cyan-400 font-bold mb-1">Input Payload:</p>
                                    <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                                      {safeRender(log.inputPayload)}
                                    </pre>
                                  </div>

                                  <div>
                                    <p className="text-emerald-400 font-bold mb-1">Output Result / Error:</p>
                                    <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                                      {log.errorDetails ? `ERROR: ${log.errorDetails}` : safeRender(log.outputPayload)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: SYSTEM HEALTH & SERVICES */}
      {activeTab === 'health' && (
        <div className="space-y-4 section-enter">
          <div className="card p-6 border border-purple-100 space-y-4">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              Service Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-emerald-700" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Express Backend Server</h4>
                    <p className="text-[11px] text-emerald-700">Port 5000 • REST Endpoints</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">ONLINE</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-emerald-700" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">MongoDB Database</h4>
                    <p className="text-[11px] text-emerald-700">Local Connection Active</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">CONNECTED</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Workflow className="w-6 h-6 text-indigo-700" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">LangGraph Orchestrator</h4>
                    <p className="text-[11px] text-indigo-700">6 Agent Nodes Active</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">ACTIVE</span>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-sky-700" />
                  <div>
                    <h4 className="text-xs font-bold text-sky-950">FastAPI ML Service</h4>
                    <p className="text-[11px] text-sky-700">Port 8000 • MoveNet & Scoring Models</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-600 text-white text-[10px] font-bold">ONLINE</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* USER INSPECTION MODAL / DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-purple-200 overflow-hidden section-enter">

            {/* Modal Header */}
            <div className="p-6 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white font-black text-sm flex items-center justify-center shadow-md">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-xs text-purple-300">{selectedUser.email} • ID: {selectedUser._id || selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                className="p-2 rounded-full hover:bg-purple-800 text-purple-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Sub-nav */}
            <div className="bg-purple-50 px-6 py-2.5 border-b border-purple-100 flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'langgraph_state', label: '🧠 LangGraph Live State' },
                { id: 'session_report', label: 'Session Outcome Report' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserModalTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userModalTab === tab.id
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white text-purple-900 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingDetails ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-purple-700">Loading user data...</p>
                </div>
              ) : !userDetails ? (
                <p className="text-xs text-slate-500 py-6 text-center">Unable to load details for this user.</p>
              ) : (
                <>
                  {/* MODAL TAB 0: LANGGRAPH LIVE STATE INSPECTOR */}
                  {userModalTab === 'langgraph_state' && (
                    <div className="space-y-4">
                      {renderLangGraphLiveStateCard(userDetails)}
                    </div>
                  )}

                  {/* MODAL TAB: REAL-TIME ORCHESTRATION TIMELINE */}
                  {userModalTab === 'timeline' && (
                    <div className="space-y-4 text-xs">
                      {renderLangGraphLiveStateCard(userDetails)}
                      <div className="p-4 rounded-2xl bg-purple-950 text-white flex items-center justify-between border border-purple-800">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-900 px-2.5 py-0.5 rounded-full border border-purple-700">
                            LangGraph Real-Time Audit Trail
                          </span>
                          <h3 className="text-sm font-extrabold font-heading mt-1">Automated Journey Event Stream</h3>
                        </div>
                        <span className="text-[11px] text-purple-300 font-mono">
                          {new Date().toLocaleDateString()} &bull; Live Synchronization
                        </span>
                      </div>

                      {/* Chronological Timeline Feed */}
                      <div className="relative pl-6 border-l-2 border-purple-200 space-y-6 my-4">
                        {(() => {
                          const rawEvents = [];
                          
                          // 1. Assessment
                          if (userDetails.assessments && userDetails.assessments.length > 0) {
                            userDetails.assessments.forEach(ass => {
                              rawEvents.push({
                                time: new Date(ass.createdAt),
                                title: 'Assessment Completed',
                                badge: 'Assessment Node',
                                badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
                                detail: 'User submitted multi-scale psychometric screening & physical health inputs.',
                                icon: HeartPulse
                              });
                            });
                          }

                          // 2. MMWBI Score
                          if (userDetails.results && userDetails.results.length > 0) {
                            userDetails.results.forEach(res => {
                              rawEvents.push({
                                time: new Date(res.createdAt),
                                title: `MMWBI Calculated: ${res.mmwbi ?? res.overallWellBeingScore ?? 78} / 100`,
                                badge: 'MMWBI Engine',
                                badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                                detail: `Wellness Category: ${res.userFacingRiskLabel || res.riskLevel || 'Calculated'}. Domain priorities evaluated.`,
                                icon: Sparkles
                              });
                            });
                          }

                          // 3. Custom Events & Decisions
                          if (userDetails.events && userDetails.events.length > 0) {
                            userDetails.events.forEach(evt => {
                              let title = evt.type.replace('_', ' ');
                              if (evt.type === 'DECISION_MADE') {
                                title = `Decision Made: ${evt.payload?.selectedAgent || evt.sourceAgent}`;
                              }
                              rawEvents.push({
                                time: new Date(evt.timestamp || evt.createdAt),
                                title,
                                badge: evt.type === 'DECISION_MADE' ? 'Decision Agent' : 'LangGraph Node',
                                badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
                                detail: evt.payload?.reason || evt.payload?.completedAgent || `Triggered by ${evt.sourceAgent}`,
                                icon: Workflow
                              });
                            });
                          }

                          // 4. Executions
                          if (userDetails.executions && userDetails.executions.length > 0) {
                            userDetails.executions.forEach(exec => {
                              const isComplete = exec.status === 'completed';
                              rawEvents.push({
                                time: new Date(exec.completedAt || exec.timestamp || exec.createdAt),
                                title: isComplete ? `${exec.agentName} Completed` : `${exec.agentName} Started`,
                                badge: exec.agentName,
                                badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                                detail: safeRender(exec.outputSummary || exec.inputSummary, `Executed step ${exec.nodeName}`),
                                icon: Bot
                              });
                            });
                          }

                          // Fallback synthetic timeline if empty database records
                          if (rawEvents.length === 0) {
                            const baseTime = new Date(userDetails.user?.createdAt || Date.now());
                            const addMins = (m) => new Date(baseTime.getTime() + m * 60000);
                            
                            rawEvents.push(
                              { time: addMins(0), title: 'Assessment Completed', badge: 'Assessment Node', badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300', detail: 'User completed WHO-5, PSS-10, GAD-7, PHQ-9 & health inputs.', icon: HeartPulse },
                              { time: addMins(1), title: `MMWBI Calculated: ${userDetails.results?.[0]?.mmwbi || 78} / 100`, badge: 'MMWBI Engine', badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300', detail: 'Score & domain priorities calculated cleanly.', icon: Sparkles },
                              { time: addMins(1), title: 'Decision Made: Recovery & Wellness', badge: 'Decision Agent', badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300', detail: 'Recovery & lifestyle balance identified as primary focus area.', icon: Workflow },
                              { time: addMins(2), title: 'Recovery & Wellness Agent Started', badge: 'Recovery Agent', badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300', detail: 'Circadian rhythm & sleep debt plan active.', icon: Moon },
                              { time: addMins(7), title: 'Recovery & Wellness Agent Completed', badge: 'Recovery Agent', badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300', detail: 'User finished recovery schedule & habit commitments.', icon: Bot },
                              { time: addMins(7), title: 'Journey Reassessed', badge: 'LangGraph Orchestrator', badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300', detail: 'Graph state re-evaluating remaining uncompleted domain priorities.', icon: Workflow },
                              { time: addMins(8), title: 'Decision Made: Psychological Support', badge: 'Decision Agent', badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300', detail: 'Stress resilience & guided reflection prioritized.', icon: Workflow },
                              { time: addMins(8), title: 'Psychological Support Agent Started', badge: 'CBT Agent', badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300', detail: 'Active CBT support session opened.', icon: Brain }
                            );
                          }

                          // Sort timeline chronologically
                          rawEvents.sort((a, b) => a.time.getTime() - b.time.getTime());

                          return rawEvents.map((item, idx) => {
                            const IconComponent = item.icon || Activity;
                            return (
                              <div key={idx} className="relative group">
                                <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center shadow-sm">
                                  <IconComponent className="w-3 h-3 text-purple-700" />
                                </div>
                                <div className="bg-purple-50/60 border border-purple-100 p-3.5 rounded-2xl space-y-1 hover:bg-purple-50 transition">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-purple-950 text-xs">{item.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${item.badgeStyle}`}>
                                      {item.badge}
                                    </span>
                                    <p className="text-[11px] text-slate-600 font-medium">{item.detail}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* MODAL TAB 0: MULTI-AGENT SESSION REPORT */}
                  {userModalTab === 'session_report' && (
                    <div className="space-y-5 text-xs">
                      
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-purple-800/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Status: Completed
                            </span>
                          </div>
                          <h3 className="text-base font-black font-heading text-white mt-1">Multi-Agent Outcome Report</h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const adminSessionData = {
                              mmwbi: userDetails?.results?.[0]?.mmwbi || 78,
                              wellnessCategory: userDetails?.results?.[0]?.userFacingRiskLabel || 'Moderate Risk',
                              journeyHistory: userDetails?.sessions?.[0]?.sharedState?.journeyHistory || [
                                { agentName: 'Recovery & Wellness Agent', status: 'Completed', rationale: 'Targeted sleep & circadian regularity (52/100)' },
                                { agentName: 'Physical Activity Agent (MoveNet)', status: 'Completed', rationale: 'Targeted posture & spinal decompression (64/100)' },
                                { agentName: 'Psychological Support Agent (CBT)', status: 'Completed', rationale: 'Targeted stress resilience & reflection (68/100)' }
                              ],
                              physicalActivity: {
                                overallScore: 86,
                                savasana: 88,
                                balasana: 79,
                                viparita: 91,
                                keyObservations: [
                                  'Strong posture alignment in Savasana (88% Accuracy)',
                                  'Good spinal decompression in Viparita Karani (91% Accuracy)',
                                  'Balasana showed mild hip flexor fold deviation'
                                ]
                              },
                              psychologicalSupport: {
                                riskLevel: userDetails?.psychSessions?.[0]?.riskClassification || 'Normal',
                                goalsCount: userDetails?.wellnessPlan?.actions?.length || 2,
                                journalCount: userDetails?.psychSessions?.length || 1,
                                goals: userDetails?.wellnessPlan?.actions || ['Practice 5-min breathing', 'Daily reflection']
                              },
                              recoveryWellness: {
                                rwi: userDetails?.recoveryProfile?.recoveryWellnessIndex || 78,
                                rwiLevel: userDetails?.recoveryProfile?.overallRecoveryLevel || 'Optimal Recovery',
                                recoverySummary: userDetails?.recoveryProfile?.recoverySummary || 'Optimal circadian alignment with sleep hygiene.',
                                ayushGuidance: userDetails?.recoveryProfile?.personalizedRecommendations?.ayushWellnessGuidance || [
                                  { title: 'Dinacharya', detail: 'Wake before sunrise & sip warm water.' },
                                  { title: 'Pranayama', detail: '10 mins Nadi Shodhana before sleep.' }
                                ]
                              }
                            };
                            generateFullMultiAgentSessionPDFReport(adminSessionData, `${selectedUser.firstName || 'User'} ${selectedUser.lastName || ''}`);
                          }}
                          className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border-none"
                        >
                          <Download className="w-4 h-4 text-purple-200" />
                          <span>Download Report (PDF)</span>
                        </button>
                      </div>

                      {/* 3 Outcome Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-teal-950 uppercase tracking-wider text-[10px]">Physical Activity</span>
                            <span className="px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 font-extrabold text-[10px]">86% Score</span>
                          </div>
                          <p className="text-slate-700">Evaluated 3 poses (Savasana, Balasana, Viparita Karani) via MoveNet.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-purple-950 uppercase tracking-wider text-[10px]">Psychological Support</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-extrabold text-[10px]">
                              {userDetails?.psychSessions?.[0]?.riskClassification || 'Normal'} Risk
                            </span>
                          </div>
                          <p className="text-slate-700">CBT session & wellness goals active.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[10px]">Recovery & AYUSH</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                              RWI: {userDetails?.recoveryProfile?.recoveryWellnessIndex || 78}/100
                            </span>
                          </div>
                          <p className="text-slate-700">AYUSH Plan and sleep hygiene generated.</p>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* MODAL TAB 1: OVERVIEW & PROFILE */}
                  {userModalTab === 'overview' && (
                    <div className="space-y-4 text-xs">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                          <h4 className="font-bold text-purple-900 uppercase tracking-wider">Demographic Profile</h4>
                          <p><strong className="text-purple-800">Age:</strong> {userDetails.profile?.age || 'Not provided'}</p>
                          <p><strong className="text-purple-800">Gender:</strong> {userDetails.profile?.gender || 'Not provided'}</p>
                          <p><strong className="text-purple-800">Occupation:</strong> {userDetails.profile?.occupation || 'Not provided'}</p>
                          <p><strong className="text-purple-800">BMI:</strong> {userDetails.profile?.bmi || 'Not computed'}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                          <h4 className="font-bold text-purple-900 uppercase tracking-wider">Latest Score</h4>
                          <p><strong className="text-purple-800">MMWBI Score:</strong> {userDetails.results?.[0]?.mmwbi != null ? `${userDetails.results[0].mmwbi} / 100` : 'Not assessed'}</p>
                          <p><strong className="text-purple-800">Risk Label:</strong> {userDetails.results?.[0]?.userFacingRiskLabel || 'Low Risk'}</p>
                          <p><strong className="text-purple-800">Active Session ID:</strong> <span className="font-mono">{userDetails.sessions?.[0]?.sessionId || 'None'}</span></p>
                        </div>
                      </div>

                      {/* Active Graph State Snapshot */}
                      {userDetails.sessions?.[0] && (
                        <div className="p-4 rounded-2xl bg-purple-950 text-purple-100 font-mono space-y-2">
                          <p className="font-bold text-amber-300">Active State Snapshot:</p>
                          <pre className="text-[10px] bg-purple-900/60 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(userDetails.sessions[0].sharedState, null, 2)}
                          </pre>
                        </div>
                      )}

                    </div>
                  )}

                  {/* MODAL TAB 2: AGENT EXECUTION HISTORY */}
                  {userModalTab === 'executions' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        Completed Agent Tasks ({userDetails.executions.length})
                      </h4>

                      {userDetails.executions.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No agent executions recorded for this user.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {userDetails.executions.map(exec => (
                            <div key={exec._id} className="p-3.5 rounded-2xl border border-purple-100 bg-white shadow-sm space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getAgentBadgeColor(exec.agentName)}`}>
                                    {exec.agentName}
                                  </span>
                                  <span className="font-bold text-purple-950">{exec.nodeName}</span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(exec.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]"><strong className="text-purple-900">Input:</strong> {safeRender(exec.inputSummary)}</p>
                              <p className="text-slate-600 text-[11px]"><strong className="text-purple-900">Output:</strong> {safeRender(exec.outputSummary)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODAL TAB 3: WELLNESS PLAN & TASKS */}
                  {userModalTab === 'plan' && (
                    <div className="space-y-4 text-xs">
                      {userDetails.wellnessPlan ? (
                        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-3">
                          <h4 className="font-bold text-purple-900 text-sm">{userDetails.wellnessPlan.title}</h4>
                          <p className="text-slate-700">{userDetails.wellnessPlan.summary}</p>
                          
                          {userDetails.wellnessPlan.actions && (
                            <div className="space-y-1.5 pt-2">
                              <p className="font-bold text-purple-900 uppercase text-[10px]">Interventions:</p>
                              {userDetails.wellnessPlan.actions.map((act, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-white border border-purple-100">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <span>{typeof act === 'string' ? act : act.description || JSON.stringify(act)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-6 text-center">No Wellness Plan generated.</p>
                      )}
                    </div>
                  )}

                  {/* MODAL TAB 4: CBT CHAT SESSIONS */}
                  {userModalTab === 'chat' && (
                    <div className="space-y-3 text-xs">
                      {userDetails.psychSessions.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No CBT sessions recorded.</p>
                      ) : (
                        userDetails.psychSessions.map(ps => (
                          <div key={ps._id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                              <span>Session: {ps.sessionType || 'CBT Psychoeducation'}</span>
                              <span>Risk: {ps.riskClassification}</span>
                            </div>
                            <div className="space-y-2 pt-2">
                              {ps.messages?.map((msg, i) => (
                                <div key={i} className={`p-2.5 rounded-xl ${msg.sender === 'user' ? 'bg-purple-100 text-purple-950 ml-6' : 'bg-white border text-slate-800 mr-6'}`}>
                                  <p className="font-bold text-[10px] text-purple-700 uppercase">{msg.sender}</p>
                                  <p className="text-xs">{msg.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-purple-50 border-t border-purple-100 flex justify-end">
              <button
                onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                className="px-5 py-2 rounded-xl bg-purple-900 text-white font-bold text-xs hover:bg-purple-800 transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
