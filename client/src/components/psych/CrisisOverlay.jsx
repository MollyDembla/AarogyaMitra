import React from 'react';
import { Phone, Shield, X, AlertTriangle, Heart } from 'lucide-react';

const CRISIS_RESOURCES = [
  { name: 'KIRAN Mental Health Helpline', contact: '1800-599-0019', available: '24/7 · Free · Govt. of India', type: 'primary' },
  { name: 'iCall (TISS)', contact: '9152987821', available: 'Mon–Sat, 8AM–10PM', type: 'primary' },
  { name: 'Vandrevala Foundation', contact: '9999 666 555', available: '24/7', type: 'primary' },
  { name: 'Snehi', contact: '044-24640050', available: 'Daily, 8AM–10PM', type: 'support' },
  { name: 'National Emergency', contact: '112', available: '24/7', type: 'emergency' }
];

/**
 * CrisisOverlay — Full-screen overlay shown ONLY when a crisis indicator is detected.
 * Cannot be triggered accidentally by normal conversation.
 * Must be explicitly dismissed by the user with "I am safe" button.
 */
export default function CrisisOverlay({ onDismiss }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #1a0b35 0%, #7f1d1d 100%)' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,100,100,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,100,100,0.2)' }}>
              <Shield className="w-5 h-5" style={{ color: '#fca5a5' }} />
            </div>
            <div>
              <h2 className="font-black text-lg text-white font-heading">You Are Not Alone</h2>
              <p className="text-xs" style={{ color: 'rgba(252,165,165,0.7)' }}>Immediate support is available right now</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            I noticed your message may indicate you are in distress. Please reach out to one of these free, confidential crisis resources immediately. You deserve support.
          </p>
        </div>

        {/* Crisis Resources */}
        <div className="p-5 space-y-3">
          {CRISIS_RESOURCES.map((r, i) => (
            <div key={i}
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{
                background: r.type === 'emergency' ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)',
                borderColor: r.type === 'emergency' ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'
              }}>
              <div>
                <p className="text-xs font-bold text-white">{r.name}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.available}</p>
              </div>
              <a href={`tel:${r.contact.replace(/\s/g, '')}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: r.type === 'emergency' ? 'rgba(220,38,38,0.5)' : 'rgba(139,98,217,0.4)',
                  color: 'white'
                }}>
                <Phone className="w-3 h-3" />
                {r.contact}
              </a>
            </div>
          ))}
        </div>

        {/* Trusted person reminder */}
        <div className="px-5 pb-3">
          <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fca5a5' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              If possible, please move to a safe space and contact someone you trust — a friend, family member, or colleague.
            </p>
          </div>
        </div>

        {/* Dismiss */}
        <div className="p-5 pt-2 space-y-2">
          <button onClick={onDismiss}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            I am safe and would like to continue
          </button>
          <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Crisis resources remain accessible in the Professional Care section
          </p>
        </div>
      </div>
    </div>
  );
}
