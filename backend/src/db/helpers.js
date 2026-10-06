'use strict';

/**
 * Small helpers that keep SQL and JSON handling in one place.
 */
const db = require('./index');

/** Run a statement that returns rows. */
function all(sql, params = {}) {
  return db.prepare(sql).all(params);
}

/** Run a statement that returns a single row (or undefined). */
function get(sql, params = {}) {
  return db.prepare(sql).get(params);
}

/** Run an INSERT/UPDATE/DELETE statement and return the change info. */
function run(sql, params = {}) {
  return db.prepare(sql).run(params);
}

/** Parse a JSON column, falling back to null when the value is empty. */
function parseJson(value) {
  if (value === null || value === undefined || value === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

module.exports = { all, get, run, parseJson };
