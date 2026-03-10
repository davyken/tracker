// src/components/TrackerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MapPanel     from './MapPanel';
import LeftPanel    from './LeftPanel';
import RightPanel   from './RightPanel';
import CaptureModal from './CaptureModal';
import { useTracker } from '../hooks/useTracker';

export default function TrackerDashboard() {
  const {
    session, captures, latest, timeline, pingCount,
    generating, toast, showModal, setShowModal,
    imageB64, setImageB64,
    generateBait, sendBaitSMS, addEvent, showToast,
  } = useTracker();

  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-7 py-3 bg-panel border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <circle cx="19" cy="19" r="17" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
            <circle cx="19" cy="19" r="11" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="19" cy="19" r="5" fill="#00d4ff" opacity="0.9"/>
            <line x1="19" y1="2" x2="19" y2="8" stroke="#00d4ff" strokeWidth="1.5"/>
            <line x1="19" y1="30" x2="19" y2="36" stroke="#00d4ff" strokeWidth="1.5"/>
            <line x1="2" y1="19" x2="8" y2="19" stroke="#00d4ff" strokeWidth="1.5"/>
            <line x1="30" y1="19" x2="36" y2="19" stroke="#00d4ff" strokeWidth="1.5"/>
          </svg>
          <div>
            <div className="font-hud font-black text-xl tracking-[0.15em] text-accent" style={{textShadow:'0 0 20px rgba(0,212,255,0.3)'}}>PHANTOM TRACK</div>
            <div className="font-mono text-[0.58rem] tracking-[0.3em] text-text-dim">ANTI-THEFT INTELLIGENCE PLATFORM — v3.0</div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <StatusPill dot="green">SYSTEM ONLINE</StatusPill>
          <StatusPill dot="red">{captures.length > 0 ? `${captures.length} CAPTURED` : '1 STOLEN DEVICE'}</StatusPill>
          <StatusPill dot="yellow">TRACKING ACTIVE</StatusPill>
          <span className="font-mono text-sm text-accent tracking-wider">{time}</span>
          <Link
            to={session ? `/bait/${session.sessionId}` : '#'}
            target="_blank"
            className="font-body font-semibold text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-warn text-warn rounded hover:bg-warn/15 transition-all"
          >
            📱 BAIT PAGE
          </Link>
        </div>
      </header>

      {/* ── ALERT BAR ── */}
      {latest && (
        <div className="flex items-center gap-4 px-5 py-2.5 bg-danger/8 border-y border-danger/30 font-mono text-xs text-danger tracking-wide">
          <span className="animate-[blink_0.8s_step-end_infinite]">⚠</span>
          <span>🎯 BAIT CLICKED — {latest.lat?.toFixed(5)}, {latest.lng?.toFixed(5)} — IP: {latest.ip} — {latest.realGPS ? '🛰 REAL GPS' : '📡 NETWORK EST.'} — ACC: ±{latest.accuracy}m</span>
        </div>
      )}

      {/* ── MAIN 3-COLUMN GRID ── */}
      <div className="flex-1 grid gap-px bg-border" style={{ gridTemplateColumns: '300px 1fr 300px' }}>
        <LeftPanel timeline={timeline} pingCount={pingCount} latest={latest} />

        {/* Center: map + itinerary */}
        <div className="flex flex-col bg-panel" style={{ gridColumn: 2 }}>
          <MapPanel latest={latest} captures={captures} session={session} />

          {/* Itinerary */}
          <div className="px-5 py-4 bg-panel2 border-t border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono text-xs text-text-dim tracking-widest">// MOVEMENT ITINERARY</span>
              <span className="font-mono text-xs text-accent">{captures.length} CAPTURES</span>
            </div>
            <div className="flex overflow-x-auto pb-2 gap-0">
              {[
                { label: 'THEFT SITE', time: '14:32', done: true },
                { label: 'Av. Kennedy', time: '14:35', done: true },
                { label: latest?.ipCity || 'TRACKING...', time: 'NOW', active: true },
                { label: captures.length > 0 ? 'CAPTURED' : 'BAIT CLICK', time: captures.length > 0 ? '✓' : 'PENDING', done: captures.length > 0 },
                { label: 'INTERCEPT', time: '--' },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold
                      ${step.done   ? 'border-success bg-success/10 text-success' :
                        step.active ? 'border-danger  bg-danger/10  text-danger pulse-red' :
                                      'border-text-dim text-text-dim'}`}>
                      {step.done ? '✓' : step.active ? '!' : '?'}
                    </div>
                    <div className="text-center">
                      <div className="font-body text-[0.72rem] font-semibold text-text whitespace-nowrap">{step.label}</div>
                      <div className="font-mono text-[0.58rem] text-text-dim">{step.time}</div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 relative overflow-hidden ${step.done ? 'scan-line' : ''}`}
                         style={{ background: step.done ? 'linear-gradient(90deg,#00ff88,#ff3c5a)' : '#0f3a5a',
                                  boxShadow: step.done ? '0 0 6px rgba(0,255,136,0.5)' : 'none' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <RightPanel
          session={session} generating={generating}
          imageB64={imageB64} setImageB64={setImageB64}
          generateBait={generateBait} sendBaitSMS={sendBaitSMS}
          showToast={showToast} latest={latest} captures={captures}
        />
      </div>

      {/* ── CAPTURE MODAL ── */}
      {showModal && latest && (
        <CaptureModal
          data={latest}
          onClose={() => setShowModal(false)}
          onPolice={() => {
            setShowModal(false);
            showToast('🚔 Report sent — Case #PT-' + Math.random().toString(36).slice(2,8).toUpperCase());
          }}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast-up fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg font-mono text-xs tracking-wide z-[9997] whitespace-nowrap
          ${toast.type === 'error' ? 'bg-panel border border-danger text-danger shadow-glow-red' : 'bg-panel border border-success text-success shadow-glow-grn'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatusPill({ dot, children }) {
  const colors = { green: 'bg-success shadow-[0_0_10px_#00ff88]', red: 'bg-danger shadow-[0_0_10px_#ff3c5a]', yellow: 'bg-warn shadow-[0_0_10px_#ffaa00]' };
  return (
    <div className="flex items-center gap-2 font-mono text-xs tracking-wide">
      <div className={`w-2 h-2 rounded-full ${colors[dot]} animate-[pulse-dot_1.5s_ease-in-out_infinite]`}></div>
      {children}
    </div>
  );
}
