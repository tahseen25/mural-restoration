/**
 * routes/auth.js — Google OAuth 2.0 + local JWT endpoints
 */

const router   = require('express').Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const User                     = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const logger                   = require('../utils/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── GOOGLE OAUTH ──────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Redirects user to Google consent screen.
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile','email'], session: false })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here. Issue JWT, redirect to frontend.
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    logger.info(`OAuth login success: ${req.user.email}`);
    // Redirect to frontend with token in query param (frontend stores in memory/cookie)
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ── LOCAL AUTH (email + password) ────────────────────────────

/**
 * POST /api/auth/register
 */
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const user = new User({ name, email, passwordHash: password, authProvider: 'local' });
      await user.save();

      const token = generateToken(user._id);
      logger.info(`New local registration: ${email}`);
      res.status(201).json({ token, user });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/auth/login
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (!user.isActive) return res.status(403).json({ error: 'Account deactivated.' });

      const token = generateToken(user._id);
      logger.info(`Local login: ${email}`);
      res.json({ token, user });
    } catch (err) { next(err); }
  }
);

/**
 * GET /api/auth/me — return current user
 */
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

/**
 * POST /api/auth/logout — (stateless JWT; client discards token)
 */
router.post('/logout', protect, (_req, res) => {
  res.json({ message: 'Logged out. Please discard your token on the client.' });
});

module.exports = router;
