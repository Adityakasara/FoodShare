const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

function notify(userId, title, message, type = 'info') {
  db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
    .run(userId, title, message, type);
}

// POST /api/deliveries — volunteer accepts a post
router.post('/', authenticate, requireRole('volunteer'), (req, res) => {
  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: 'post_id required' });

  const post = db.prepare('SELECT * FROM food_posts WHERE id = ?').get(post_id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.status !== 'available') return res.status(409).json({ error: 'Post is no longer available' });

  // Create delivery
  const result = db.prepare(
    'INSERT INTO deliveries (post_id, volunteer_id) VALUES (?, ?)'
  ).run(post_id, req.user.id);

  // Update post status
  db.prepare("UPDATE food_posts SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(post_id);

  // Notify donor
  notify(post.donor_id, '✅ Volunteer Accepted!', `${req.user.name} has accepted delivery for "${post.food_name}"`, 'success');

  res.status(201).json(db.prepare(`
    SELECT d.*, fp.food_name, fp.pickup_address, fp.quantity, u.name AS volunteer_name
    FROM deliveries d
    JOIN food_posts fp ON fp.id = d.post_id
    JOIN users u ON u.id = d.volunteer_id
    WHERE d.id = ?
  `).get(result.lastInsertRowid));
});

// GET /api/deliveries — volunteer sees their deliveries
router.get('/', authenticate, (req, res) => {
  let rows;
  if (req.user.role === 'volunteer') {
    rows = db.prepare(`
      SELECT d.*, fp.food_name, fp.pickup_address, fp.quantity, fp.description, fp.category,
             fp.latitude, fp.longitude, u.name AS donor_name, u.phone AS donor_phone
      FROM deliveries d
      JOIN food_posts fp ON fp.id = d.post_id
      JOIN users u ON u.id = fp.donor_id
      WHERE d.volunteer_id = ?
      ORDER BY d.accepted_at DESC
    `).all(req.user.id);
  } else {
    // donor: see deliveries for their posts
    rows = db.prepare(`
      SELECT d.*, fp.food_name, fp.pickup_address, fp.quantity,
             u.name AS volunteer_name, u.phone AS volunteer_phone
      FROM deliveries d
      JOIN food_posts fp ON fp.id = d.post_id
      JOIN users u ON u.id = d.volunteer_id
      WHERE fp.donor_id = ?
      ORDER BY d.accepted_at DESC
    `).all(req.user.id);
  }
  res.json(rows);
});

// PATCH /api/deliveries/:id/status — advance delivery status
router.patch('/:id/status', authenticate, requireRole('volunteer'), (req, res) => {
  const delivery = db.prepare(`
    SELECT d.*, fp.food_name, fp.donor_id
    FROM deliveries d
    JOIN food_posts fp ON fp.id = d.post_id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.volunteer_id !== req.user.id) return res.status(403).json({ error: 'Not your delivery' });

  const transitions = { accepted: 'picked_up', picked_up: 'delivered' };
  const next = transitions[delivery.status];
  if (!next) return res.status(400).json({ error: `Cannot advance from status: ${delivery.status}` });

  const notes = req.body.notes || null;
  const now = new Date().toISOString();

  if (next === 'picked_up') {
    // node:sqlite: undefined is not bindable — use null explicitly
    db.prepare("UPDATE deliveries SET status = 'picked_up', pickup_at = ?, notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END WHERE id = ?").run(now, notes, notes, delivery.id);
    db.prepare("UPDATE food_posts SET status = 'picked_up', updated_at = datetime('now') WHERE id = ?").run(delivery.post_id);
    notify(delivery.donor_id, '🚗 Food Picked Up!', `Your "${delivery.food_name}" has been picked up by the volunteer.`, 'info');
  } else if (next === 'delivered') {
    db.prepare("UPDATE deliveries SET status = 'delivered', delivered_at = ?, notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END WHERE id = ?").run(now, notes, notes, delivery.id);
    db.prepare("UPDATE food_posts SET status = 'delivered', updated_at = datetime('now') WHERE id = ?").run(delivery.post_id);
    notify(delivery.donor_id, '🎉 Delivered Successfully!', `Your "${delivery.food_name}" has been delivered. Thank you for your generosity!`, 'success');
  }

  res.json(db.prepare(`
    SELECT d.*, fp.food_name, fp.pickup_address, u.name AS donor_name
    FROM deliveries d
    JOIN food_posts fp ON fp.id = d.post_id
    JOIN users u ON u.id = fp.donor_id
    WHERE d.id = ?
  `).get(delivery.id));
});

module.exports = router;
