// src/components/CaptureModal.jsx
export default function CaptureModal({ data, onClose, onPolice }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9000] backdrop-blur-sm" onClick={onClose}>
      <div className="modal-pop bg-panel border border-danger rounded-xl p-8 max-w-lg w-[90%] shadow-[0_0_60px_rgba(255,60,90,0.2)]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-danger/10 border-2 border-danger rounded-full flex items-center justify-center text-2xl" style={{animation:'spin-pulse 2s ease-in-out infinite'}}>🎯</div>
          <div>
            <div className="font-hud font-black text-2xl text-danger tracking-wide">THIEF LOCATED!</div>
            <div className="font-mono text-xs text-text-dim tracking-widest mt-0.5">// BAIT PAGE ACTIVATED — LOCATION ACQUIRED</div>
          </div>
        </div>

        <div className="bg-panel2 border border-border rounded-lg p-4 mb-4 space-y-2">
          {[
            ['📍 Coordinates', `${data.lat?.toFixed(6)}, ${data.lng?.toFixed(6)}`, 'text-danger'],
            ['🌐 IP Address',  data.ip,       'text-text'],
            ['🏙 City/Region', data.ipCity ? `${data.ipCity}, ${data.ipRegion}` : 'Unknown', 'text-accent'],
            ['📱 Device',      data.device,   'text-text'],
            ['🌍 Browser',     data.browser,  'text-text'],
            ['🎯 Accuracy',    `±${data.accuracy}m (${data.realGPS ? '🛰 Real GPS' : '📡 Network'})`, 'text-success'],
            ['⏱ Timestamp',   data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—', 'text-success'],
          ].map(([k, v, c]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-border/30 font-mono text-xs last:border-0">
              <span className="text-text-dim">{k}</span>
              <span className={c}>{v || '—'}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded overflow-hidden mb-1">
          <div className="h-full bg-gradient-to-r from-danger to-warn rounded animate-[progress_1s_ease_forwards]" style={{width:'100%', transition:'width 1s'}}></div>
        </div>
        <p className="font-mono text-[0.6rem] text-text-dim mb-5 tracking-wide">Location pinned on map — itinerary updated</p>

        <div className="flex gap-3">
          <button onClick={onClose}   className="flex-1 py-2.5 bg-gradient-to-br from-[#0044aa] to-[#0088cc] text-white font-body font-bold text-xs tracking-widest rounded-lg border border-accent hover:-translate-y-0.5 transition-all">📍 VIEW ON MAP</button>
          <button onClick={onPolice}  className="flex-1 py-2.5 bg-gradient-to-br from-[#660020] to-[#cc0033] text-white font-body font-bold text-xs tracking-widest rounded-lg border border-danger hover:-translate-y-0.5 transition-all">🚔 ALERT POLICE</button>
        </div>
      </div>

      <style>{`
        @keyframes spin-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,60,90,0.4); }
          50%      { box-shadow: 0 0 0 14px rgba(255,60,90,0); }
        }
      `}</style>
    </div>
  );
}
