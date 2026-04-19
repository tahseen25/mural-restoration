/**
 * models/Gallery.js — Community gallery posts
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, maxlength: 500, trim: true },
}, { timestamps: true });

const GallerySchema = new mongoose.Schema({
  // ── References ───────────────────────────────────────────────
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  restorationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restoration', required: true },

  // ── Post metadata ────────────────────────────────────────────
  title:       { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: '', maxlength: 1000, trim: true },
  tags:        [{ type: String, lowercase: true, trim: true }],
  style:       { type: String, default: null },   // from model prediction

  // ── Engagement ───────────────────────────────────────────────
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  views:    { type: Number, default: 0 },

  // ── Visibility ───────────────────────────────────────────────
  isPublic:  { type: Boolean, default: true, index: true },
  isFeatured:{ type: Boolean, default: false },

  // ── Soft delete ──────────────────────────────────────────────
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// ── Virtual: like count ───────────────────────────────────────
GallerySchema.virtual('likeCount').get(function () {
  return this.likes?.length ?? 0;
});
GallerySchema.virtual('commentCount').get(function () {
  return this.comments?.length ?? 0;
});

// ── Full-text search index ────────────────────────────────────
GallerySchema.index({ title: 'text', description: 'text', tags: 'text' });
GallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Gallery', GallerySchema);
