/**
 * utils/logger.js — Winston logger with file + console transports
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) =>
  `${ts} [${level}]: ${stack || message}`
);

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    // Console — coloured in dev
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
    }),
    // Rotating file logs
    new transports.File({ filename: path.join(LOG_DIR, 'error.log'),  level: 'error' }),
    new transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'rejections.log') }),
  ],
});

// Add http level
logger.http = (msg) => logger.log('http', msg);

module.exports = logger;
