import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { generateAgenticPlan } from '../utils/agentPlanGenerator';

const WellnessContext = createContext(null);

/**
 * WellnessProvider — single source of truth for all wellness data.
 * Every authenticated page consumes this context instead of making isolated API calls.
 * MMWBI, domain scores, report, and journey are guaranteed to be identical across all pages.
 */
export function WellnessProvider({ children, user }) {
  const [wellnessData, setWellnessData] = useState(null);   // { result, report, journey }
  const [profile, setProfile] = useState(null);              // UserProfile
  const [recoveryProfile, setRecoveryProfile] = useState(null); // Latest RecoveryProfile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Fetch in parallel — all from single source of truth endpoints
      const [wellnessRes, profileRes, recoveryRes] = await Promise.allSettled([
        api.get('/wellness/latest'),
        api.get('/profile'),
        api.get('/recovery/profile/latest')
      ]);

      if (wellnessRes.status === 'fulfilled') {
        const d = wellnessRes.value;
        const data = d.data || d;
        // Normalize: always surface result, report, journey at top level
        setWellnessData({
          result: data.result || null,
          report: data.report || null,
          journey: data.journey || null
        });
      }

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value;
        setProfile(p.data || p || null);
      }

      if (recoveryRes.status === 'fulfilled') {
        const r = recoveryRes.value;
        setRecoveryProfile(r.data || r || null);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.message || 'Failed to load wellness data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Convenience accessors derived from the single source
  const mmwbi = wellnessData?.result?.overallWellBeingScore ?? null;
  const domainScores = wellnessData?.result?.domainScores ?? {};
  const psychometricScores = wellnessData?.result?.psychometricScores ?? {};
  const wellnessCategory = (wellnessData?.result?.userFacingRiskLabel || wellnessData?.result?.wellnessCategory) ?? null;
  const primaryConcerns = wellnessData?.result?.primaryConcerns ?? [];
  const strengths = wellnessData?.result?.strengths ?? [];
  const currentAgent = wellnessData?.journey?.currentAgent ?? null;
  const recommendationReason = wellnessData?.journey?.recommendationReason ?? null;
  const hasAssessment = !!wellnessData?.result;
  const rwi = recoveryProfile?.recoveryWellnessIndex ?? null;

  // Compute agentic plan flow dynamically from single source of truth
  const planData = useMemo(() => generateAgenticPlan(wellnessData), [wellnessData]);
  const agentPlan = planData.plan;
  const currentPlanStep = planData.currentStep;
  const nextPlanStep = planData.nextStep;
  const progressPercent = planData.progressPercent;

  const value = {
    // Raw data
    wellnessData,
    profile,
    recoveryProfile,
    user,
    loading,
    error,
    lastRefresh,

    // Derived — guaranteed same value across all pages
    mmwbi,
    domainScores,
    psychometricScores,
    wellnessCategory,
    primaryConcerns,
    strengths,
    currentAgent,
    recommendationReason,
    hasAssessment,
    rwi,

    // Agentic Plan Flow
    agentPlan,
    currentPlanStep,
    nextPlanStep,
    progressPercent,

    // Actions
    refresh: fetchAll
  };

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error('useWellness must be used within a WellnessProvider');
  return ctx;
}

export default WellnessContext;
