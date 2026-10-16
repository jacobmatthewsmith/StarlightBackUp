// SQLite index for users, sessions, progress, player-system metadata and usage.
// Player systems themselves live as versioned JSON documents (see systems.js);
// this database only indexes ownership, visibility and search metadata.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      display_name  TEXT NOT NULL,
      pass_hash     TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      version     INTEGER NOT NULL,
      json        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS systems (
      id              TEXT PRIMARY KEY,          -- "fictional:<uuid>"
      owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      version         INTEGER NOT NULL,
      passed_level1   INTEGER NOT NULL DEFAULT 0,
      published       INTEGER NOT NULL DEFAULT 0,
      published_name  TEXT,                      -- public display name at publish time
      map_x REAL, map_y REAL, map_z REAL,        -- fictional map coordinates (ly)
      updated_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS systems_owner ON systems(owner_id);
    CREATE INDEX IF NOT EXISTS systems_published ON systems(published);

    CREATE TABLE IF NOT EXISTS usage (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT,
      kind        TEXT NOT NULL,                 -- tutor | research | delegation | vision | explore
      model       TEXT,
      tokens_in   INTEGER NOT NULL DEFAULT 0,
      tokens_out  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    );
  `);
  return db;
}
