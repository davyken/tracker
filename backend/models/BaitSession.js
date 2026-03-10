const mongoose = require('mongoose');

const baitSessionSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true, index: true },
  amount:     { type: String, required: true },
  sender:     { type: String, required: true },
  message:    { type: String, default: 'Tap to confirm your payment' },
  mode:       { type: String, enum: ['receipt', 'image'], default: 'receipt' },
  imageData:  { type: String },          // base64 if image mode
  targetPhone:{ type: String },          // thief's phone number
  smsSent:    { type: Boolean, default: false },
  clicked:    { type: Boolean, default: false },
  clickedAt:  { type: Date },
  createdAt:  { type: Date, default: Date.now },
  expiresAt:  { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) },
});

module.exports = mongoose.model('BaitSession', baitSessionSchema);
