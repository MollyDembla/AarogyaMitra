import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Brain, Activity, Sparkles, ShieldCheck, ArrowRight,
  CheckCircle2, Flower2, Moon, TrendingUp, Shield, Users,
  Mic, ChevronDown, Star, Zap, Heart, Globe
} from 'lucide-react';
import heroImg from '../assets/AarogyaMitra Hero Image.png';

const JOURNEY_STEPS = [
  { icon: Sparkles, label: 'Assess', desc: 'Understand your physical, lifestyle, psychological and health-related factors through validated questionnaires.' },
  { icon: Brain, label: 'Understand', desc: 'Generate a personalized multimodal wellness profile with domain-specific scores.' },
  { icon: Heart, label: 'Support', desc: 'Receive personalized recovery, psychological and physical-wellness guidance from specialized AI agents.' },
  { icon: TrendingUp, label: 'Improve', desc: 'Track your wellness progress over time with longitudinal assessment history.' },
  { icon: Globe, label: 'Connect', desc: 'Get guided toward appropriate professional care when required through verified resources.' },
];

const AGENTS = [
  {
    icon: HeartPulse,
    gradient: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)',
    bg: '#f5f0fb',
    title: 'Wellness Assessment Agent',
    tag: 'Foundation',
    desc: 'Integrates validated WHO-5, PSS-10, GAD-7, PHQ-9 psychometrics with lifestyle and physical data to compute your Multimodal Well-Being Index (MMWBI).'
  },
  {
    icon: Moon,
    gradient: 'linear-gradient(135deg, #1565c0, #42a5f5)',
    bg: '#e3f2fd',
    title: 'Recovery & Wellness Agent',
    tag: 'Specialized',
    desc: 'Analyzes sleep quality, circadian regularity, fatigue recovery, and stress-recovery balance. Generates your Recovery Wellness Index (RWI) with personalized guidance.'
  },
  {
    icon: Brain,
    gradient: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
    bg: '#e8f5e9',
    title: 'Psychological Support Agent',
    tag: 'Specialized',
    desc: 'Empathetic conversational AI with voice interaction, CBT-based psychoeducation, mood tracking, guided journaling, and structured coping strategies.'
  },
  {
    icon: Activity,
    gradient: 'linear-gradient(135deg, #e65100, #ff7043)',
    bg: '#fce4d6',
    title: 'Physical Activity Agent',
    tag: 'Specialized',
    desc: 'AI-guided physical activity assessment and pose detection for movement quality evaluation and personalized exercise guidance.'
  },
  {
    icon: Shield,
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    bg: '#fff8e1',
    title: 'Professional Care Navigation',
    tag: 'Escalation',
    desc: 'Deterministic rule-based agent that evaluates when professional support is appropriate and provides verified Indian mental health resources and care pathways.'
  },
];

const WHY_ITEMS = [
  { icon: CheckCircle2, text: 'Holistic multimodal assessment across 6 wellness domains' },
  { icon: Brain, text: 'Personalized AI support from specialized agents' },
  { icon: TrendingUp, text: 'Continuous progress monitoring and longitudinal tracking' },
  { icon: Mic, text: 'Voice-enabled psychological support conversations' },
  { icon: Shield, text: 'Professional-care navigation with verified resources' },
  { icon: ShieldCheck, text: 'Deterministic safety layer — not LLM-controlled' },
  { icon: Users, text: 'User-centered, privacy-first design' },
  { icon: Zap, text: 'Zero hallucination on critical clinical thresholds' },
];

const FLOW_STEPS = [
  'Landing Page', 'Sign Up / Login', 'Onboarding', 'Wellness Assessment',
  'MMWBI + Domain Scores', 'Wellness Report', 'Dashboard',
  'Reasoning Agent', 'Specialized Agents', 'Progress Monitoring', 'Professional Care (if needed)'
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-cover bg-right bg-no-repeat flex items-center"
        style={{
          backgroundImage: `url(${heroImg})`,
          minHeight: '92vh'
        }}>
        {/* Soft overlay on left side for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/95 via-purple-50/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <div className="space-y-8 max-w-xl">
            <div className="flex flex-wrap gap-2">
              <span className="pill pill-purple"><Sparkles className="w-3 h-3" /> Agentic AI Wellness</span>
              <span className="pill" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
                <ShieldCheck className="w-3 h-3" /> Non-Diagnostic
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-black font-heading leading-[1.05]" style={{ color: '#1a0b35' }}>
                Your Intelligent<br />
                <span style={{ background: 'linear-gradient(135deg, #6b3fb0, #9f7dd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Companion
                </span><br />
                for Holistic<br />Well-Being
              </h1>

              <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
                AarogyaMitra brings wellness assessment, recovery support, psychological support, physical activity guidance and professional-care navigation together in one intelligent platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary text-base px-7 py-4">
                Start Assessment <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn-ghost text-base px-7 py-4">
                Explore Agents <ChevronDown className="w-5 h-5" />
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: ShieldCheck, text: 'Validated Questionnaires' },
                { icon: Shield, text: 'Privacy First' },
                { icon: Zap, text: 'Real-time AI Analysis' }
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/85 backdrop-blur-sm border border-purple-100 shadow-sm">
                  <Icon className="w-4 h-4" style={{ color: '#6b3fb0' }} />
                  <span className="text-xs font-semibold" style={{ color: '#2a1349' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column empty to let background artwork show through cleanly */}
          <div className="hidden lg:block h-full min-h-[420px]" />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce z-10">
          <span className="text-xs font-medium" style={{ color: '#9f7dd4' }}>Explore</span>
          <ChevronDown className="w-4 h-4" style={{ color: '#9f7dd4' }} />
        </div>
      </section>

      {/* ── JOURNEY FLOW ─────────────────────────────────────── */}
      <section id="approach" style={{ background: 'white', borderTop: '1px solid #ede5f7' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
          <div className="text-center space-y-3 mb-16">
            <div className="pill pill-purple mx-auto w-fit">Your Wellness Journey</div>
            <h2 className="text-4xl font-black font-heading" style={{ color: '#1a0b35' }}>
              One Unified Wellness Ecosystem
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: '#64748b' }}>
              AarogyaMitra is not a collection of tools. It is a single intelligent system where one shared user profile flows through specialized AI agents.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 relative">
            {/* Connector */}
            <div className="absolute top-10 left-[10%] right-[10%] h-0.5 hidden md:block"
              style={{ background: 'linear-gradient(90deg, #ede5f7, #6b3fb0, #ede5f7)' }} />

            {JOURNEY_STEPS.map(({ icon: Icon, label, desc }, i) => (
              <div key={label} className="flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: i === 2 ? 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' : 'white', border: '2px solid #ede5f7' }}>
                  <Icon className="w-8 h-8" style={{ color: i === 2 ? 'white' : '#6b3fb0' }} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-heading" style={{ color: '#2a1349' }}>{label}</h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALIZED AGENTS ───────────────────────────────── */}
      <section id="features" style={{ background: '#faf7f4', borderTop: '1px solid #ede5f7' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
          <div className="text-center space-y-3 mb-16">
            <div className="pill pill-purple mx-auto w-fit">Specialized AI Agents</div>
            <h2 className="text-4xl font-black font-heading" style={{ color: '#1a0b35' }}>
              Five Intelligent Agents Working Together
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Modular AI agents delivering targeted, explainable guidance — each performing a specific responsibility in your wellness journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map(({ icon: Icon, gradient, bg, title, tag, desc }) => (
              <div key={title} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}>
                    <Icon className="w-6 h-6" style={{ color: bg === '#f5f0fb' ? '#6b3fb0' : undefined, background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: '#f5f0fb', color: '#6b3fb0', border: '1px solid #ede5f7' }}>
                    {tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base font-heading mb-2" style={{ color: '#2a1349' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY AAROGYAMITRA ─────────────────────────────────── */}
      <section id="about" style={{ background: '#faf7f4', borderTop: '1px solid #ede5f7' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="pill pill-purple w-fit">Why AarogyaMitra</div>
              <h2 className="text-4xl font-black font-heading" style={{ color: '#1a0b35' }}>
                Designed for the<br />Long-Term Journey
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#64748b' }}>
                AarogyaMitra is not a one-time assessment. It is a continuous wellness companion that adapts to your needs, tracks your progress over time, and escalates intelligently when professional support is warranted.
              </p>
              <Link to="/signup" className="btn-primary inline-flex">
                Begin Your Journey <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {WHY_ITEMS.map(({ icon: Icon, text }) => (
                <div key={text} className="card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f5f0fb' }}>
                    <Icon className="w-4 h-4" style={{ color: '#6b3fb0' }} />
                  </div>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: '#475569' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
