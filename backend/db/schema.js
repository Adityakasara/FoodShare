// Uses Node.js built-in SQLite (available since Node.js 22.5.0)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'food_share.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('donor', 'volunteer')),
    phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS food_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    description TEXT,
    quantity TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','accepted','picked_up','delivered','expired','cancelled')),
    pickup_address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    expiry_time TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (donor_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL UNIQUE,
    volunteer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK(status IN ('accepted','picked_up','delivered','cancelled')),
    accepted_at TEXT DEFAULT (datetime('now')),
    pickup_at TEXT,
    delivered_at TEXT,
    notes TEXT,
    FOREIGN KEY (post_id) REFERENCES food_posts(id),
    FOREIGN KEY (volunteer_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── Tiny helper wrappers to match better-sqlite3 API ──────────────────
// node:sqlite uses .prepare() which returns a StatementSync with
// .get(), .all(), .run() — exactly the same surface as better-sqlite3,
// but run() accepts positional args (not spread), and .all() / .get()
// can take named params or positional.
// We re-export db directly since the API is compatible.

module.exports = db;
