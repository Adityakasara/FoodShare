const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

// Helper to create a notification
function notify(userId, title, message, type = 'info') {
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
        .run(userId, title, message, type);
}

// ─── Priority Engine ──────────────────────────────────────────
// Returns { level, score, label, hoursLeft }
// level: 'critical' | 'high' | 'medium' | 'low' | 'expired'
function computePriority(post) {
    const now = Date.now();
    const ageHours = (now - new Date(post.created_at).getTime()) / 3600000;
    const freshness = Math.max(0, 100 - ageHours * 2);

    if (!post.expiry_time) {
        return { level: 'low', score: 200 + freshness, label: 'Normal', hoursLeft: null };
    }

    const expiryMs  = new Date(post.expiry_time).getTime();
    const hoursLeft = (expiryMs - now) / 3600000;

    if (hoursLeft <= 0)  return { level: 'expired',  score: -1,                          label: 'Expired',  hoursLeft: 0 };
    if (hoursLeft <= 2)  return { level: 'critical', score: 1000 + (2 - hoursLeft)*100,  label: 'Critical', hoursLeft };
    if (hoursLeft <= 6)  return { level: 'high',     score:  700 + (6 - hoursLeft)*30,   label: 'Urgent',   hoursLeft };
    if (hoursLeft <= 24) return { level: 'medium',   score:  400 + (24 - hoursLeft)*5,   label: 'Soon',     hoursLeft };
    return { level: 'low', score: 200 + freshness, label: 'Normal', hoursLeft };
}

// GET /api/posts — list posts
// Volunteers: available only, sorted by priority (critical first)
// Donors: their own posts, sorted by created_at DESC
router.get('/', authenticate, (req, res) => {
    const { lat, lng, radius = 50, category, status } = req.query;

    let rows;
    if (req.user.role === 'donor') {
        let q = `
      SELECT fp.*, u.name AS donor_name,
             d.status AS delivery_status, d.volunteer_id,
             (SELECT name FROM users WHERE id = d.volunteer_id) AS volunteer_name
      FROM food_posts fp
      JOIN users u ON u.id = fp.donor_id
      LEFT JOIN deliveries d ON d.post_id = fp.id
      WHERE fp.donor_id = ?
    `;
        const params = [req.user.id];
        if (status) { q += ' AND fp.status = ?'; params.push(status); }
        q += ' ORDER BY fp.created_at DESC';
        rows = db.prepare(q).all(...params);
    } else {
        let q = `
      SELECT fp.*, u.name AS donor_name
      FROM food_posts fp
      JOIN users u ON u.id = fp.donor_id
      WHERE fp.status = 'available'
    `;
        const params = [];
        if (category) { q += ' AND fp.category = ?'; params.push(category); }
        rows = db.prepare(q).all(...params);

        // Location-based filtering (Haversine)
        if (lat && lng) {
            const uLat = parseFloat(lat), uLng = parseFloat(lng), r = parseFloat(radius);
            rows = rows.filter(p => {
                if (!p.latitude || !p.longitude) return true;
                const dLat = (p.latitude - uLat) * Math.PI / 180;
                const dLng = (p.longitude - uLng) * Math.PI / 180;
                const a = Math.sin(dLat/2)**2 + Math.cos(uLat*Math.PI/180)*Math.cos(p.latitude*Math.PI/180)*Math.sin(dLng/2)**2;
                const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return dist <= r;
            });
        }

        // ── PRIORITY SORT — critical first ──────────────────────
        rows = rows
            .map(p => ({ ...p, _p: computePriority(p) }))
            .sort((a, b) => b._p.score - a._p.score)
            .map(p => ({
                ...p,
                priority_level:      p._p.level,
                priority_label:      p._p.label,
                priority_hours_left: p._p.hoursLeft,
                _p: undefined
            }));
    }

    res.json(rows);
});

// GET /api/posts/stats — platform leaderboard & impact metrics
router.get('/stats', authenticate, (req, res) => {
    const topDonors = db.prepare(`
        SELECT u.name, COUNT(*) AS delivered_count
        FROM food_posts fp JOIN users u ON u.id = fp.donor_id
        WHERE fp.status = 'delivered'
        GROUP BY fp.donor_id ORDER BY delivered_count DESC LIMIT 5
    `).all();

    const topVolunteers = db.prepare(`
        SELECT u.name, COUNT(*) AS delivery_count
        FROM deliveries d JOIN users u ON u.id = d.volunteer_id
        WHERE d.status = 'delivered'
        GROUP BY d.volunteer_id ORDER BY delivery_count DESC LIMIT 5
    `).all();

    const totals = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM food_posts) AS total_posts,
          (SELECT COUNT(*) FROM food_posts WHERE status = 'delivered') AS total_delivered,
          (SELECT COUNT(*) FROM food_posts WHERE status = 'available') AS total_available,
          (SELECT COUNT(*) FROM users WHERE role = 'donor') AS total_donors,
          (SELECT COUNT(*) FROM users WHERE role = 'volunteer') AS total_volunteers
    `).get();

    res.json({ topDonors, topVolunteers, totals });
});

// GET /api/posts/:id
router.get('/:id', authenticate, (req, res) => {
    const post = db.prepare(`
    SELECT fp.*, u.name AS donor_name, u.phone AS donor_phone,
           d.status AS delivery_status, d.accepted_at, d.pickup_at, d.delivered_at,
           (SELECT name FROM users WHERE id = d.volunteer_id) AS volunteer_name
    FROM food_posts fp
    JOIN users u ON u.id = fp.donor_id
    LEFT JOIN deliveries d ON d.post_id = fp.id
    WHERE fp.id = ?
  `).get(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    const priority = computePriority(post);
    res.json({ ...post, priority_level: priority.level, priority_label: priority.label, priority_hours_left: priority.hoursLeft });
});

// POST /api/posts — donor creates a post
router.post('/', authenticate, requireRole('donor'), (req, res) => {
    const { food_name, description, quantity, category, pickup_address, latitude, longitude, expiry_time } = req.body;
    if (!food_name || !quantity || !pickup_address) {
        return res.status(400).json({ error: 'food_name, quantity and pickup_address are required' });
    }

    const result = db.prepare(`
    INSERT INTO food_posts (donor_id, food_name, description, quantity, category, pickup_address, latitude, longitude, expiry_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, food_name, description || null, quantity, category || 'other', pickup_address, latitude || null, longitude || null, expiry_time || null);

    const post     = db.prepare('SELECT * FROM food_posts WHERE id = ?').get(result.lastInsertRowid);
    const priority = computePriority(post);
    const urgTag   = priority.level === 'critical' ? '🚨 URGENT: ' : priority.level === 'high' ? '⚡ ' : '';

    const volunteers = db.prepare("SELECT id FROM users WHERE role = 'volunteer'").all();
    for (const v of volunteers) {
        notify(v.id, `${urgTag}🍽️ New Food Available!`, `${req.user.name} posted: ${food_name} (${quantity}) at ${pickup_address}`, 'food');
    }

    res.status(201).json({ ...post, priority_level: priority.level, priority_label: priority.label });
});

// PATCH /api/posts/:id
router.patch('/:id', authenticate, (req, res) => {
    const post = db.prepare('SELECT * FROM food_posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (req.user.role === 'donor' && post.donor_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

    const { food_name, description, quantity, category, pickup_address, status } = req.body;
    db.prepare(`
    UPDATE food_posts SET
      food_name      = CASE WHEN ? IS NOT NULL THEN ? ELSE food_name      END,
      description    = CASE WHEN ? IS NOT NULL THEN ? ELSE description    END,
      quantity       = CASE WHEN ? IS NOT NULL THEN ? ELSE quantity       END,
      category       = CASE WHEN ? IS NOT NULL THEN ? ELSE category       END,
      pickup_address = CASE WHEN ? IS NOT NULL THEN ? ELSE pickup_address END,
      status         = CASE WHEN ? IS NOT NULL THEN ? ELSE status         END,
      updated_at     = datetime('now')
    WHERE id = ?
  `).run(
        food_name||null, food_name||null,
        description||null, description||null,
        quantity||null, quantity||null,
        category||null, category||null,
        pickup_address||null, pickup_address||null,
        status||null, status||null,
        req.params.id
    );

    res.json(db.prepare('SELECT * FROM food_posts WHERE id = ?').get(req.params.id));
});

// DELETE /api/posts/:id
router.delete('/:id', authenticate, requireRole('donor'), (req, res) => {
    const post = db.prepare('SELECT * FROM food_posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.donor_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });
    db.prepare('DELETE FROM food_posts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Post deleted' });
});

module.exports = router;
