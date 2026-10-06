'use strict';

/**
 * Central configuration. All secrets come from environment variables so that
 * nothing sensitive is ever committed to source control.
 */
require('dotenv').config();

const bool = (value, fallback) => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Comma separated list of origins allowed to call the API during development.
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    // File name of the SQLite database, created automatically on first run.
    file: process.env.DB_FILE || 'nutriplan.sqlite',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'openai', // "openai" or "none"
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 45000),
    // When no key is configured the app runs in demo mode with local templates.
    demoMode: bool(process.env.AI_DEMO_MODE, false),
  },
};

// Warn once at startup if the developer forgot to set a real secret.
if (config.nodeEnv === 'production' && config.jwt.secret === 'dev-only-insecure-secret-change-me') {
  // eslint-disable-next-line no-console
  console.warn('[config] WARNING: JWT_SECRET is not set. Set it before deploying.');
}

module.exports = config;
