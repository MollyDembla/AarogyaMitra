import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Brain, CheckCircle2 } from 'lucide-react';

export default function AssessmentProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Simulate multi-agent processing steps then navigate to Dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 animate-pulse">
          <Brain className="w-8 h-8" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-heading text-slate-900">Processing Assessment</h1>
        <p className="text-sm text-slate-600">Our Wellness Assessment Agent and Reasoning Engine are evaluating your inputs...</p>
      </div>

      <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl text-xs text-slate-700 font-medium">
        <div className="flex items-center gap-2 text-teal-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>Calculated psychometric scale indexes</span>
        </div>
        <div className="flex items-center gap-2 text-teal-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>Synthesized lifestyle and health context</span>
        </div>
        <div className="flex items-center gap-2 text-teal-700">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Reasoning Engine evaluating primary agent routing...</span>
        </div>
      </div>
    </div>
  );
}
