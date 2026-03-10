// src/components/LeftPanel.jsx
export default function LeftPanel({ timeline, pingCount, latest }) {
  return (
    <div className="bg-panel p-5 overflow-y-auto" style={{ gridColumn: 1 }}>
      {/* Device Card */}
      <div className="font-mono text-xs text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="text-accent">//</span> Device Registry
      </div>

      <div className="bg-panel2 border border-border rounded-md p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[3px] h-full bg-danger" style={{boxShadow:'0 0 12px #ff3c5a'}}></div>
        <div className="font-hud font-bold text-base mb-1 ml-2">📱 iPhone 15 Pro</div>
        <div className="font-mono text-xs text-text-dim leading-relaxed ml-2">
          IMEI: <span className="text-accent">356938035643809</span><br/>
          Owner: <span className="text-accent">Jean-Paul K.</span><br/>
          Last seen: <span className="text-accent">14:32 — Yaoundé</span><br/>
          Network: <span className="text-accent">MTN CM · 4G</span>
        </div>
        <div className="inline-flex items-center gap-1 mt-2 ml-2 bg-danger/10 border border-danger/30 text-danger font-mono text-xs px-2 py-1 rounded">
          ⚡ STOLEN — TRACKING
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { val: pingCount, label: 'PINGS RECV',  cls: 'text-danger' },
          { val: latest ? `±${latest.accuracy}m` : '±--', label: 'ACCURACY', cls: 'text-success' },
          { val: latest ? `${calcDist(latest.lat, latest.lng)}km` : '--', label: 'FROM HOME', cls: 'text-accent' },
          { val: latest?.realGPS ? 'GPS' : (latest ? 'NET' : '--'), label: 'SOURCE', cls: 'text-warn' },
        ].map(({ val, label, cls }) => (
          <div key={label} className="bg-panel2 border border-border rounded p-3 text-center">
            <div className={`font-hud font-black text-2xl leading-none ${cls}`}>{val}</div>
            <div className="font-mono text-[0.58rem] text-text-dim tracking-wide mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="font-mono text-xs text-text-dim uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="text-accent">//</span> Event Timeline
      </div>
      <div className="mb-4 space-y-0">
        {timeline.map((item, i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-border/40 font-mono text-xs">
            <span className="text-text-dim min-w-[42px]">{item.time}</span>
            <span className={
              item.type === 'danger'  ? 'text-danger' :
              item.type === 'success' ? 'text-success' :
              item.type === 'warn'    ? 'text-warn' : 'text-text'
            }>{item.event}</span>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="font-mono text-xs text-text-dim uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="text-accent">//</span> Signal Intelligence
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'GPS SIGNAL', val: 'STRONG', pct: 82, color: '#00ff88' },
          { label: '4G SIGNAL',  val: 'GOOD',   pct: 70, color: '#00ff88' },
          { label: 'CAPTURES',   val: pingCount, pct: Math.min(pingCount * 10, 100), color: '#ffaa00' },
          { label: 'STATUS',     val: latest ? 'LOCKED' : 'HUNTING', pct: latest ? 100 : 30, color: latest ? '#00ff88' : '#ff3c5a' },
        ].map(({ label, val, pct, color }) => (
          <div key={label} className="bg-panel2 border border-border rounded p-2">
            <div className="font-mono text-[0.58rem] text-text-dim tracking-wide">{label}</div>
            <div className="font-hud font-bold text-sm text-text mt-0.5">{val}</div>
            <div className="h-[3px] bg-white/5 rounded mt-1.5 overflow-hidden">
              <div className="h-full rounded transition-all duration-1000" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calcDist(lat, lng) {
  if (!lat || !lng) return '--';
  const R = 6371;
  const dLat = (lat - 3.8667) * Math.PI / 180;
  const dLng = (lng - 11.5167) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(3.8667*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}
