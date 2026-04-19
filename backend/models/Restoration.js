/**
 * models/Restoration.js — Restoration job results
 */

const mongoose = require('mongoose');

const RestorationSchema = new mongoose.Schema({
  // ── References ───────────────────────────────────────────────
  userId:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true,
  },

  // ── Configuration ────────────────────────────────────────────
  mode: {
    type: String,
    enum: ['original', 'sliding_window'],
    default: 'original',
  },
  damageType: {
    type: String,
    enum: ['faded','cracked','stained','peeling','moisture','flaking','auto'],
    default: 'auto',
  },

  // ── Processing ───────────────────────────────────────────────
  status: {
    type: String,
    enum: ['queued','processing','completed','failed'],
    default: 'queued',
    index: true,
  },
  processingTimeMs: { type: Number, default: null },
  errorMessage:     { type: String, default: null },
  progress:         { type: Number, default: 0, min: 0, max: 100 },

  // ── Output images (stored as Buffer; large outputs → GridFS) ─
  restoredData:   { type: Buffer, default: null },
  maskData:       { type: Buffer, default: null },
  restoredMime:   { type: String, default: 'image/png' },

  // ── Quality metrics ──────────────────────────────────────────
  metrics: {
    psnr:  { type: Number, default: null },
    ssim:  { type: Number, default: null },
    lpips: { type: Number, default: null },
  },

  // ── Model outputs ────────────────────────────────────────────
  predictedStyle:      { type: String, default: null },
  detectedDamageTypes: [{ type: String }],
  damageScore:         { type: Number, min: 0, max: 1, default: null },

  // ── Gallery ──────────────────────────────────────────────────
  isPublic:  { type: Boolean, default: false, index: true },
  galleryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery',
    default: null,
  },

  // ── Soft delete ──────────────────────────────────────────────
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.restoredData;
      delete ret.maskData;
      delete ret.__v;
      return ret;
    },
  },
});

// ── Compound index for history queries ────────────────────────
RestorationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Restoration', RestorationSchema);
