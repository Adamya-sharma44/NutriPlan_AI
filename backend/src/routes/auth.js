'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { get, run } = require('../db/helpers');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth, readToken, verifyToken } = require('../middleware/auth');
const ApiError = require('../middleware/ApiError');
const { validateRegistration, validateLogin } = require('../middleware/validate');

const router = express.Router();

// A little extra protection against password guessing on the auth endpoints.
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please wait a few minutes and try again.',
  },
});

/** Shape a user row for the API (never include the password hash). */
function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { errors, value } = validateRegistration(req.body);
    if (Object.keys(errors).length > 0) {
      throw ApiError.badRequest('Please check the highlighted fields and try again.', errors);
    }

    const existing = get('SELECT id FROM users WHERE email = @email', { email: value.email });
    if (existing) {
      throw ApiError.badRequest('An account with that email already exists.', {
        email: 'An account with that email already exists. Try signing in instead.',
      });
    }

    // Hash the password so plaintext is never stored.
    const passwordHash = await bcrypt.hash(value.password, 10);
    const result = run(
      'INSERT INTO users (name, email, password_hash) VALUES (@name, @email, @passwordHash)',
      { name: value.name, email: value.email, passwordHash }
    );

    const user = get('SELECT * FROM users WHERE id = @id', { id: result.lastInsertRowid });
    setAuthCookie(res, signToken(user));

    res.status(201).json({ success: true, message: 'Your account has been created.', user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { errors, value } = validateLogin(req.body);
    if (Object.keys(errors).length > 0) {
      throw ApiError.badRequest('Please check the highlighted fields and try again.', errors);
    }

    const user = get('SELECT * FROM users WHERE email = @email', { email: value.email });

    // Compare against a dummy hash when the user is missing so that the response
    // time does not reveal whether the email exists.
    const hash = user ? user.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const passwordMatches = await bcrypt.compare(value.password, hash);

    if (!user || !passwordMatches) {
      throw ApiError.badRequest('That email or password is not correct.', {
        password: 'That email or password is not correct.',
      });
    }

    setAuthCookie(res, signToken(user));
    res.json({ success: true, message: 'Welcome back!', user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been signed out.' });
});

// GET /api/auth/me
//
// This is a "who am I" probe called once on every page load, so it answers 200
// even when nobody is signed in. A signed-out visitor is a normal result here,
// not an error, which keeps the browser console clean on the landing page.
// Every endpoint that actually needs a session still uses requireAuth.
router.get('/me', (req, res) => {
  const token = readToken(req);
  if (!token) return res.json({ success: true, user: null });

  try {
    const payload = verifyToken(token);
    const user = get('SELECT id, name, email, created_at FROM users WHERE id = @id', { id: payload.sub });
    res.json({ success: true, user: user ? publicUser(user) : null });
  } catch {
    // An expired or invalid token simply means "signed out".
    clearAuthCookie(res);
    res.json({ success: true, user: null });
  }
});

module.exports = router;
