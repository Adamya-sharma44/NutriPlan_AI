'use strict';

const config = require('../config');
const ApiError = require('./ApiError');

/** 404 handler for unknown API routes. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound('That API endpoint does not exist.'));
}

/**
 * Central error handler. It turns errors into a consistent JSON shape:
 * { success: false, message, errors? } and never leaks internals.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : err.status || 500;

  // Expected, user-facing problems are logged quietly.
  if (!isApiError || status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err && err.stack ? err.stack : err);
  }

  const message = isApiError
    ? err.message
    : status === 429
      ? 'Too many requests. Please wait a moment and try again.'
      : 'Something went wrong on our side. Please try again.';

  res.status(status).json({
    success: false,
    message,
    ...(isApiError && err.details ? { errors: err.details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler, ApiError, config };
