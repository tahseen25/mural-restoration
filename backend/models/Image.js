/**
 * models/Image.js — Uploaded image metadata + GridFS reference
 */

const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  // ── Ownership ────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ── File metadata ────────────────────────────────────────────
  originalName:    { type: String, required: true },
  mimeType:        { type: String, required: true },
  sizeBytes:       { type: Number, required: true },
  width:           { type: Number },
  height:          { type: Number },

  // ── GridFS references ────────────────────────────────────────
  // Stored as Buffer in MongoDB (for simplicity; swap to GridFS for >16MB)
  originalData:    { type: Buffer, required: true },

  // ── Processing state ─────────────────────────────────────────
  status: {
    type: String,
    enum: ['uploaded', 'queued', 'processing', 'completed', 'failed'],
    default: 'uploaded',
    index: true,
  },
  errorMessage: { type: String, default: null },

  // ── Analysis ─────────────────────────────────────────────────
  detectedDamageTypes: [{ type: String }],
  predictedStyle:      { type: String, default: null },
  damageScore:         { type: Number, min: 0, max: 1, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.originalData; // never send raw bytes over API
      delete ret.__v;
      return ret;
    },
  },
});

// ── Virtual: data URL for thumbnail (only in specific routes) ─
ImageSchema.methods.toDataURL = function () {
  if (!this.originalData) return null;
  return `data:${this.mimeType};base64,${this.originalData.toString('base64')}`;
};

module.exports = mongoose.model('Image', ImageSchema);
