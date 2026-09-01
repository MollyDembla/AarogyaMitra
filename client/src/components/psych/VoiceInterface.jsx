import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';

/**
 * VoiceInterface — Web Speech API based voice interaction.
 * STT: SpeechRecognition (browser native)
 * TTS: SpeechSynthesis (browser native)
 * No external API required.
 */
export default function VoiceInterface({ onTranscript, agentReply, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => { setIsListening(true); setError(''); };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      setError(e.error === 'no-speech' ? 'No speech detected. Try again.' : 'Voice error. Please try text mode.');
    };

    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal && t.trim()) {
        onTranscript(t.trim());
        setTranscript('');
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [onTranscript]);

  // Auto-speak agent reply when voice mode is on
  useEffect(() => {
    if (!voiceEnabled || !agentReply || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(agentReply);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [agentReply, voiceEnabled]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  if (!supported) {
    return (
      <div className="text-xs p-3 rounded-xl border" style={{ background: '#fff8e1', borderColor: '#fde68a', color: '#92400e' }}>
        Voice is not supported in this browser. Use Chrome for best experience. Text mode available below.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{ background: voiceEnabled ? '#f0fdf4' : '#f8fafc', borderColor: voiceEnabled ? '#86efac' : '#e2e8f0' }}>
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" style={{ color: voiceEnabled ? '#16a34a' : '#94a3b8' }} />
          <span className="text-xs font-semibold" style={{ color: voiceEnabled ? '#16a34a' : '#64748b' }}>
            Voice Mode {voiceEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
        <button
          onClick={() => { setVoiceEnabled(v => !v); stopSpeaking(); }}
          className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200"
          style={{ background: voiceEnabled ? '#16a34a' : '#cbd5e1' }}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${voiceEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Mic Control */}
      {voiceEnabled && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || isSpeaking}
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
            style={{ background: isListening ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #6b3fb0, #9f7dd4)' }}>
            {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
            {isListening && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#dc2626' }} />
            )}
          </button>

          <p className="text-xs text-center" style={{ color: '#64748b' }}>
            {isListening ? '🔴 Listening...' : isSpeaking ? '🔊 Agent speaking...' : 'Tap mic to speak'}
          </p>

          {transcript && (
            <div className="w-full p-3 rounded-xl border text-xs italic" style={{ background: '#f5f0fb', borderColor: '#ede5f7', color: '#6b3fb0' }}>
              {transcript}
            </div>
          )}

          {isSpeaking && (
            <button onClick={stopSpeaking}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
              <Square className="w-3 h-3" /> Stop
            </button>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: '#dc2626' }}>{error}</p>
          )}

          <p className="text-[10px] text-center" style={{ color: '#94a3b8' }}>
            AI psychological support · Does not replace professional mental health care
          </p>
        </div>
      )}
    </div>
  );
}
