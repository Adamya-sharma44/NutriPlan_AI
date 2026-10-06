'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('./ApiError');
const { get } = require('../db/helpers');

const COOKIE_NAME = 'nutriplan_token';

/** Create a signed JWT for a user id. */
function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Store the JWT in an httpOnly cookie so the frontend JavaScript can never read
 * it. This also protects against the most common XSS token theft.
 */
function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

/** Read the token from the cookie, falling back to a Bearer header for tools like Postman. */
function readToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();

  return null;
}

/** Verify a token and return its payload, or throw if it is invalid/expired. */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Route guard. Verifies the token, confirms the user still exists, and attaches
 * the user record to req.user for downstream handlers.
 */
function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized('Please sign in to continue.');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    }

    const user = get(
      'SELECT id, name, email, created_at FROM users WHERE id = @id',
      { id: payload.sub }
    );
    if (!user) throw ApiError.unauthorized('Your account could not be found. Please sign in again.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  readToken,
  requireAuth,
};
