/**
 * routes/users.js — User profile management
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');

const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const logger  = require('../utils/logger');

// ── GET /api/users/me ─────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ user });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/me — update profile ─────────────────────
router.patch('/me', protect,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('preferences.defaultOutputSize').optional().isIn(['original','2048','1024','512']),
    body('preferences.autoPublishToGallery').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const allowed = ['name', 'preferences'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-passwordHash');

      logger.info(`User profile updated: ${user.email}`);
      res.json({ user });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/users/me/password ──────────────────────────────
router.patch('/me/password', protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Min 8 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const user = await User.findById(req.user._id);
      if (user.authProvider !== 'local') {
        return res.status(400).json({ error: 'Password change not applicable for OAuth accounts.' });
      }

      const ok = await user.comparePassword(req.body.currentPassword);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

      user.passwordHash = req.body.newPassword; // pre-save hook hashes it
      await user.save();

      res.json({ message: 'Password updated.' });
    } catch (err) { next(err); }
  }
);

// ── GET /api/users/me/stats ───────────────────────────────────
router.get('/me/stats', protect, async (req, res, next) => {
  try {
    const Restoration = require('../models/Restoration');
    const Gallery     = require('../models/Gallery');

    const [totalJobs, completedJobs, galleryPosts] = await Promise.all([
      Restoration.countDocuments({ userId: req.user._id, deletedAt: null }),
      Restoration.countDocuments({ userId: req.user._id, status: 'completed', deletedAt: null }),
      Gallery.countDocuments({ userId: req.user._id, deletedAt: null }),
    ]);

    const user = await User.findById(req.user._id).select('storageUsedBytes createdAt');

    res.json({
      stats: {
        totalJobs,
        completedJobs,
        galleryPosts,
        storageUsedMB: (user.storageUsedBytes / 1e6).toFixed(2),
        memberSince: user.createdAt,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
