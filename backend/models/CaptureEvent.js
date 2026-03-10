const mongoose = require('mongoose');

const captureEventSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, index: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  accuracy:    { type: Number },
  altitude:    { type: Number },
  realGPS:     { type: Boolean, default: false },
  ip:          { type: String },
  ipCity:      { type: String },
  ipRegion:    { type: String },
  ipCountry:   { type: String },
  ipOrg:       { type: String },
  userAgent:   { type: String },
  device:      { type: String },
  browser:     { type: String },
  os:          { type: String },
  screenW:     { type: Number },
  screenH:     { type: Number },
  language:    { type: String },
  platform:    { type: String },
  timestamp:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('CaptureEvent', captureEventSchema);
