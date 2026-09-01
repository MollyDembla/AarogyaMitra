import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Activity, Brain, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function AgentJourneyPage() {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const res = await api.get('/journey/current');
        if (res.success) {
          setJourney(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJourney();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-500 font-medium">Loading agent journey state...</div>;
  }

  const currentAgentName = journey?.currentAgent || 'Recovery and Wellness Agent';

  const getAgentRoute = (name) => {
    switch (name) {
      case 'Physical Activity Agent': return '/agent/physical-activity';
      case 'Psychological Support Agent': return '/agent/psychological-support';
      case 'Professional Support Pathway': return '/agent/professional-support';
      case 'Recovery and Wellness Agent': return '/agent/recovery-wellness';
      default: return '/agent/recovery-wellness';
    }
  };

  const getAgentIcon = (name) => {
    switch (name) {
      case 'Physical Activity Agent': return Activity;
      case 'Psychological Support Agent': return Brain;
      case 'Professional Support Pathway': return ShieldAlert;
      default: return Sparkles;
    }
  };

  const CurrentIcon = getAgentIcon(currentAgentName);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
          <Compass className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Sequential Agent Journey</h1>
          <p className="text-sm text-slate-600">Orchestrated by Reasoning and Decision-Making Agent</p>
        </div>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Journey Sequence Tracker</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Assessment ✓</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Report Generated ✓</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Reasoning Engine ✓</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-800 text-white font-semibold flex items-center gap-2 shadow">
            <CurrentIcon className="w-4 h-4 text-teal-200" />
            <span>{currentAgentName.split(' ')[0]} → Current</span>
          </div>
        </div>
      </div>

      {/* Primary Agent Card */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-teal-800/80 rounded-2xl border border-teal-600/30">
            <CurrentIcon className="w-10 h-10 text-teal-300" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">Selected Agent</span>
            <h2 className="text-2xl font-bold font-heading">{currentAgentName}</h2>
          </div>
        </div>

        <p className="text-slate-200 text-sm leading-relaxed">
          The Reasoning Agent analyzed your wellness metrics, screening flags, and physical limitations to assign this specialized module as your highest priority next step.
        </p>

        <div className="pt-2">
          <Link
            to={getAgentRoute(currentAgentName)}
            className="inline-flex items-center gap-2 bg-teal-400 text-teal-950 hover:bg-teal-300 font-semibold px-6 py-3.5 rounded-xl shadow transition-all text-sm"
          >
            Enter {currentAgentName}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Completed Agents History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900">Completed Agent Visits</h3>
        {journey?.completedAgents && journey.completedAgents.length > 0 ? (
          <ul className="space-y-2">
            {journey.completedAgents.map((agent, idx) => (
              <li key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>{agent}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 italic">No agent visits completed in this cycle yet.</p>
        )}
      </div>
    </div>
  );
}
