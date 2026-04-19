/**
 * middleware/auth.js — JWT verification middleware
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * protect — verifies Bearer JWT, attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated. Token missing.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Auth middleware error: ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * optionalAuth — attaches req.user if token present, else continues
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    }
  } catch (_) { /* ignore */ }
  next();
};

/**
 * requireAdmin — must follow protect
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

/**
 * generateToken — helper used in auth routes
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { protect, optionalAuth, requireAdmin, generateToken };
