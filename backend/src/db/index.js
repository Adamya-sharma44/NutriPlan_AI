'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');

const dbFile = path.isAbsolute(config.db.file)
  ? config.db.file
  : path.join(__dirname, '..', '..', config.db.file);

// Create the folder that will hold the database file if it does not exist yet.
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);

// WAL keeps reads fast while a request is writing.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Create the tables on first run. Using CREATE TABLE IF NOT EXISTS makes the
 * server safe to start repeatedly without a separate migration step.
 */
function initialise() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      name        TEXT    NOT NULL,
      goal        TEXT,
      preferences TEXT    NOT NULL,   -- JSON blob of the form input
      plan        TEXT    NOT NULL,   -- JSON blob of the generated plan
      grocery     TEXT,               -- JSON blob of the grocery list
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_meal_plans_user
      ON meal_plans (user_id, created_at DESC);
  `);
}

initialise();

module.exports = db;
