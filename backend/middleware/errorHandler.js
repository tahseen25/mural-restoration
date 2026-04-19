/**
 * middleware/errorHandler.js — Centralised error handling
 */

const logger = require('../utils/logger');

/**
 * notFound — catch-all 404
 */
const notFound = (req, res, next) => {
  const err = new Error(`Not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

/**
 * errorHandler — formats and logs all errors
 */
const errorHandler = (err, req, res, _next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log 5xx errors
  if (status >= 500) {
    logger.error(`${status} ${req.method} ${req.path} — ${message}`, {
      stack: err.stack,
      body:  req.body,
    });
  } else {
    logger.warn(`${status} ${req.method} ${req.path} — ${message}`);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists.` });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(422).json({ error: 'Validation failed', details: errors });
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large.' });
  }

  res.status(status).json({
    error:   message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
