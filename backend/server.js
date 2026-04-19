/**
 * server.js — Mural Restoration Platform API
 * Entry point: loads env, connects DB, mounts routes, starts HTTP server.
 */

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const compression = require('compression');
const morgan     = require('morgan');
const passport   = require('passport');
const rateLimit  = require('express-rate-limit');

const connectDB  = require('./config/database');
const logger     = require('./utils/logger');
require('./config/passport');          // register Google strategy

// ── Route modules ─────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const imageRoutes       = require('./routes/images');
const restorationRoutes = require('./routes/restorations');
const galleryRoutes     = require('./routes/gallery');
const userRoutes        = require('./routes/users');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Global rate limiter ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body parsing & compression ────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── HTTP logging ──────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Passport (OAuth) ─────────────────────────────────────────
app.use(passport.initialize());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/images',       imageRoutes);
app.use('/api/restorations', restorationRoutes);
app.use('/api/gallery',      galleryRoutes);

// ── 404 / error handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀  Server running on port ${PORT}  [${process.env.NODE_ENV}]`);
});

module.exports = app; // for testing
