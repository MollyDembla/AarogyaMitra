import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import logoImg from '../assets/AarogyaMitra logo.png';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [agreedConsent, setAgreedConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!agreedConsent) return;
    setLoading(true);
    try {
      // Start a draft assessment
      await api.post('/assessment/start');
      navigate('/assessment');
    } catch (err) {
      console.error(err);
      navigate('/assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="AarogyaMitra" className="h-10 object-contain" />
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-900">Welcome to AarogyaMitra</h1>
            <p className="text-sm text-slate-600">Your Intelligent Companion for Holistic Well-Being</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed border-y border-slate-100 py-6">
          <p>
            AarogyaMitra helps you map out your physical, psychological, and lifestyle well-being. Before starting your comprehensive assessment, please review how your information will be used:
          </p>

          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <span><strong>Holistic Input:</strong> You will complete standardized screening questionnaires (WHO-5, PSS-10, GAD-7, PHQ-9), lifestyle metrics, and general health info.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <span><strong>Explainable AI Guidance:</strong> A central Wellness Agent and Reasoning Engine analyze your state to route you to specialized wellness agents.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <span><strong>Non-Diagnostic System:</strong> All scores are wellness indicators only. AarogyaMitra does not diagnose clinical conditions or replace licensed healthcare professionals.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span>Consent & Privacy Confirmation</span>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedConsent}
              onChange={(e) => setAgreedConsent(e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-600">
              I understand that AarogyaMitra is a wellness assessment tool and not a medical diagnosis platform. I consent to providing information for generating my personalized wellness profile.
            </span>
          </label>
        </div>

        <button
          onClick={handleProceed}
          disabled={!agreedConsent || loading}
          className="w-full bg-teal-800 hover:bg-teal-700 text-white font-medium py-3.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'Starting Assessment...' : 'Begin Comprehensive Wellness Assessment'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
