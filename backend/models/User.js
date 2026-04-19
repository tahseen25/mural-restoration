/**
 * models/User.js — User schema
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────
  name:   { type: String, required: true, trim: true, maxlength: 100 },
  email:  {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  avatar: { type: String, default: null },

  // ── Auth ────────────────────────────────────────────────────
  googleId:     { type: String, default: null, index: true },
  passwordHash: { type: String, default: null },   // null for OAuth-only users
  authProvider: {
    type: String,
    enum: ['google', 'local'],
    default: 'local',
  },

  // ── Stats ───────────────────────────────────────────────────
  restorationCount: { type: Number, default: 0 },
  storageUsedBytes: { type: Number, default: 0 },

  // ── Preferences ─────────────────────────────────────────────
  preferences: {
    defaultOutputSize:   { type: String, default: 'original' },
    autoPublishToGallery:{ type: Boolean, default: false },
  },

  // ── Status ──────────────────────────────────────────────────
  isActive: { type: Boolean, default: true },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
});

// ── Instance method: compare password ────────────────────────
UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// ── Pre-save: hash password ───────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

module.exports = mongoose.model('User', UserSchema);
