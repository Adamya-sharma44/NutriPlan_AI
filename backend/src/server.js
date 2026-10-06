'use strict';

/**
 * NutriPlan AI — Express API server.
 *
 * Responsibilities kept deliberately small:
 *   1. load configuration and the database
 *   2. mount the route modules
 *   3. provide one health endpoint and a friendly error handler
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config');
require('./db'); // opening the database also creates the tables

const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const aiRoutes = require('./routes/ai');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const aiService = require('./services/aiService');

const app = express();

// Needed for correct secure cookies and client IPs behind a proxy in production.
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/tool requests (no Origin header) and the configured origins.
      if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('This origin is not allowed to use the NutriPlan AI API.'));
    },
    credentials: true, // required so the auth cookie is sent
  })
);

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// A simple global ceiling to protect the whole API.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please wait a moment and try again.' },
  })
);

// GET /api/health — used to confirm the backend is running.
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'NutriPlan AI API', ai: aiService.getStatus() });
});

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/ai', aiRoutes);

// Unknown API route, then the central error handler.
app.use('/api', notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  const status = aiService.getStatus();
  // eslint-disable-next-line no-console
  console.log(`\n  NutriPlan AI API running on http://localhost:${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`  AI mode: ${status.mode}${status.mode === 'demo' ? ` — ${status.reason}` : ` (${status.model})`}\n`);
});

// Close the database cleanly on shutdown.
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n  ${signal} received, shutting down.`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
