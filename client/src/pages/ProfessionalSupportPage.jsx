import React, { useState, useEffect } from 'react';
import { Shield, Phone, UserCheck, Heart, Info, AlertTriangle, CheckCircle2, ArrowRight, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { useWellness } from '../context/WellnessContext';
import AgentNavigationHeader from '../components/AgentNavigationHeader';

const CARE_LEVEL_CONFIG = {
  1: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: CheckCircle2, label: 'Wellness Support' },
  2: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: AlertTriangle, label: 'Professional Support Recommended' },
  3: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: AlertTriangle, label: 'Urgent Professional Support' },
  4: { color: '#7f1d1d', bg: '#fef2f2', border: '#fca5a5', icon: AlertTriangle, label: 'Immediate Support' }
};

function ResourceCard({ resource, emergency = false }) {
  return (
    <div className="p-4 rounded-xl border flex items-start justify-between gap-4"
      style={{ background: emergency ? '#fff1f2' : 'white', borderColor: emergency ? '#fca5a5' : '#e2e8f0' }}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{resource.name}</span>
          {resource.type === 'crisis' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>Crisis</span>
          )}
          {resource.cost === 'Free' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a' }}>Free</span>
          )}
        </div>
        {resource.organization && <p className="text-xs" style={{ color: '#64748b' }}>{resource.organization}</p>}
        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{resource.description}</p>
        {resource.available && <p className="text-[10px] font-medium" style={{ color: '#9f7dd4' }}>{resource.available}</p>}
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <a href={`tel:${resource.contact?.replace(/\s/g, '')}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: emergency ? '#dc2626' : 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
          <Phone className="w-3.5 h-3.5" />
          {resource.contact}
        </a>
        {resource.website && (
          <a href={resource.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold border"
            style={{ color: '#6b3fb0', borderColor: '#ede5f7' }}>
            <ExternalLink className="w-3 h-3" /> Website
          </a>
        )}
      </div>
    </div>
  );
}

function PlatformCard({ resource }) {
  return (
    <div className="p-4 rounded-xl border space-y-2" style={{ background: 'white', borderColor: '#e2e8f0' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{resource.name}</span>
        {resource.type === 'platform' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Online</span>
        )}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{resource.description}</p>
      {resource.website && (
        <a href={resource.website} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold"
          style={{ color: '#6b3fb0' }}>
          <ExternalLink className="w-3 h-3" /> Visit {resource.name}
        </a>
      )}
    </div>
  );
}

export default function ProfessionalSupportPage() {
  const { wellnessData, mmwbi, domainScores, psychometricScores, primaryConcerns } = useWellness();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);
  const [showAllCrisis, setShowAllCrisis] = useState(false);

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const res = await api.post('/agents/professional-support/evaluate', {});
        if (res.success) {
          setData(res.data.agentOutput || res.data.outputData || res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPath();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-xl animate-pulse flex items-center justify-center" style={{ background: '#f5f0fb' }}>
          <Shield className="w-5 h-5" style={{ color: '#6b3fb0' }} />
        </div>
        <p className="text-sm" style={{ color: '#9f7dd4' }}>Evaluating your care pathway...</p>
      </div>
    );
  }

  const careLevel = data?.careLevel || 1;
  const careCfg = CARE_LEVEL_CONFIG[careLevel] || CARE_LEVEL_CONFIG[1];
  const CareLevelIcon = careCfg.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-8">
      <AgentNavigationHeader activeKey="professional-support" />
      {/* Header Banner */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${careCfg.color}20, ${careCfg.color}05)`, border: `1.5px solid ${careCfg.border}` }}>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: careCfg.bg, border: `1px solid ${careCfg.border}` }}>
              <Shield className="w-7 h-7" style={{ color: careCfg.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-black font-heading" style={{ color: '#1a0b35' }}>Professional Care Navigation</h1>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: careCfg.bg, color: careCfg.color, border: `1px solid ${careCfg.border}` }}>
                  {careCfg.label} · {data?.urgency || 'Routine'}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                {data?.urgencyDescription || 'Professional guidance based on your wellness assessment.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Recommended + Context Summary */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Why this was recommended */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" style={{ color: '#6b3fb0' }} />
            <h2 className="font-bold text-sm font-heading" style={{ color: '#1a0b35' }}>Why This Was Recommended</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
            {data?.reason || 'Based on your wellness assessment results.'}
          </p>
          {data?.factors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Specific Factors:</p>
              {data.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: careCfg.color }} />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Summary */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-sm font-heading" style={{ color: '#1a0b35' }}>Your Wellness Summary</h2>
          <div className="space-y-2">
            {[
              { label: 'Wellness Index (MMWBI)', value: data?.contextSummary?.mmwbi },
              { label: 'Anxiety Screening (GAD-7)', value: data?.contextSummary?.gadSeverity },
              { label: 'Depression Screening (PHQ-9)', value: data?.contextSummary?.phqSeverity },
              { label: 'Mental Well-Being (WHO-5)', value: data?.contextSummary?.who5Percentage },
              { label: 'Stress Level (PSS-10)', value: data?.contextSummary?.pssScore },
              { label: 'Recovery Index', value: data?.contextSummary?.recoveryScore }
            ].map(({ label, value }) => value && value !== 'Not assessed' && value !== 'Not available' ? (
              <div key={label} className="flex justify-between text-xs py-1.5 border-b" style={{ borderColor: '#f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>{value}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* Recommended Professional Type */}
      {data?.professionalType && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" style={{ color: '#6b3fb0' }} />
            <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Recommended Professional</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border space-y-2"
              style={{ background: '#f5f0fb', borderColor: '#c9b3f5' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm" style={{ color: '#2a1349' }}>{data.professionalType}</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#6b3fb0', color: 'white' }}>Primary</span>
              </div>
              {data.professionalDescriptions?.[data.professionalType] && (
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                  {data.professionalDescriptions[data.professionalType]}
                </p>
              )}
            </div>
            {data.alternativeProfessionalType && (
              <div className="p-4 rounded-2xl border space-y-2" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: '#2a1349' }}>{data.alternativeProfessionalType}</span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>Alternative</span>
                </div>
                {data.professionalDescriptions?.[data.alternativeProfessionalType] && (
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                    {data.professionalDescriptions[data.alternativeProfessionalType]}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="p-3.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
              <strong style={{ color: '#1e293b' }}>Why this recommendation: </strong>
              {data.professionalTypeReasoning}
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {data?.nextSteps?.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Recommended Next Steps</h2>
          <div className="space-y-2">
            {data.nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl border"
                style={{ background: i === 0 ? '#f5f0fb' : 'white', borderColor: i === 0 ? '#c9b3f5' : '#e2e8f0' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
                  style={{ background: i === 0 ? '#6b3fb0' : '#e2e8f0', color: i === 0 ? 'white' : '#64748b' }}>
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#2a1349' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Helplines & Crisis Resources */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" style={{ color: '#dc2626' }} />
            <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Free Helplines & Crisis Resources</h2>
          </div>
          <button onClick={() => setShowAllCrisis(v => !v)}
            className="text-xs font-semibold" style={{ color: '#6b3fb0' }}>
            {showAllCrisis ? 'Show Less' : 'Show All'}
          </button>
        </div>

        <div className="space-y-3">
          {(data?.crisisResources || [])
            .slice(0, showAllCrisis ? undefined : 3)
            .map((r, i) => <ResourceCard key={i} resource={r} />)}
        </div>

        {/* Emergency resource */}
        {data?.emergencyResource && (
          <ResourceCard resource={data.emergencyResource} emergency={true} />
        )}
      </div>

      {/* Online Professional Platforms */}
      {data?.resources?.professional?.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-base font-heading" style={{ color: '#1a0b35' }}>Online Professional Platforms</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {data.resources.professional.map((r, i) => <PlatformCard key={i} resource={r} />)}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
          {data?.safetyDisclaimer || 'AarogyaMitra is a wellness companion and does NOT diagnose clinical conditions or prescribe treatments. These recommendations are based on wellness screening.'}
        </p>
      </div>
    </div>
  );
}
