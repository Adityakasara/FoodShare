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

// Lightweight schema migrations for existing DBs
const deliveryColumns = db.prepare("PRAGMA table_info(deliveries)").all();
if (!deliveryColumns.some(c => c.name === 'receiver_name')) {
  db.exec('ALTER TABLE deliveries ADD COLUMN receiver_name TEXT;');
}
if (!deliveryColumns.some(c => c.name === 'proof_image')) {
  db.exec('ALTER TABLE deliveries ADD COLUMN proof_image TEXT;');
}

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

db.exec(`
  CREATE TABLE IF NOT EXISTS delivery_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(delivery_id, reviewer_id),
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS issue_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('quality','timeliness','communication','safety','other')),
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE VIEW IF NOT EXISTS user_reputation AS
  SELECT
    u.id AS user_id,
    ROUND(COALESCE(AVG(dr.rating), 0), 2) AS avg_rating,
    COUNT(dr.id) AS rating_count,
    (
      SELECT COUNT(*)
      FROM issue_reports ir
      WHERE ir.reported_user_id = u.id
        AND ir.status = 'open'
        AND datetime(ir.created_at) >= datetime('now', '-30 days')
    ) AS open_reports_30d,
    CASE
      WHEN (
        SELECT COUNT(*)
        FROM issue_reports ir2
        WHERE ir2.reported_user_id = u.id
          AND ir2.status = 'open'
          AND datetime(ir2.created_at) >= datetime('now', '-30 days')
      ) >= 2 THEN 1
      ELSE 0
    END AS under_review
  FROM users u
  LEFT JOIN delivery_reviews dr ON dr.reviewee_id = u.id
  GROUP BY u.id;
`);

// ── Tiny helper wrappers to match better-sqlite3 API ──────────────────
// node:sqlite uses .prepare() which returns a StatementSync with
// .get(), .all(), .run() — exactly the same surface as better-sqlite3,
// but run() accepts positional args (not spread), and .all() / .get()
// can take named params or positional.
// We re-export db directly since the API is compatible.

module.exports = db;
