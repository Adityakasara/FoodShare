const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

const REPORT_CATEGORIES = ['quality', 'timeliness', 'communication', 'safety', 'other'];
const MAX_REVIEW_NOTE_LENGTH = 300;
const MAX_REPORT_DETAILS_LENGTH = 1000;
const MAX_RECEIVER_NAME_LENGTH = 120;
const MAX_PROOF_IMAGE_LENGTH = 1500000;

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
             fp.latitude, fp.longitude, u.name AS donor_name, u.phone AS donor_phone,
             CASE WHEN dr.id IS NULL THEN 0 ELSE 1 END AS current_user_reviewed
      FROM deliveries d
      JOIN food_posts fp ON fp.id = d.post_id
      JOIN users u ON u.id = fp.donor_id
      LEFT JOIN delivery_reviews dr ON dr.delivery_id = d.id AND dr.reviewer_id = ?
      WHERE d.volunteer_id = ?
      ORDER BY d.accepted_at DESC
    `).all(req.user.id, req.user.id);
  } else {
    // donor: see deliveries for their posts
    rows = db.prepare(`
      SELECT d.*, fp.food_name, fp.pickup_address, fp.quantity,
             u.name AS volunteer_name, u.phone AS volunteer_phone,
             CASE WHEN dr.id IS NULL THEN 0 ELSE 1 END AS current_user_reviewed
      FROM deliveries d
      JOIN food_posts fp ON fp.id = d.post_id
      JOIN users u ON u.id = d.volunteer_id
      LEFT JOIN delivery_reviews dr ON dr.delivery_id = d.id AND dr.reviewer_id = ?
      WHERE fp.donor_id = ?
      ORDER BY d.accepted_at DESC
    `).all(req.user.id, req.user.id);
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
  const receiverName = typeof req.body.receiver_name === 'string' ? req.body.receiver_name.trim() : '';
  const proofImage = typeof req.body.proof_image === 'string' ? req.body.proof_image.trim() : '';
  const now = new Date().toISOString();

  if (next === 'picked_up') {
    // node:sqlite: undefined is not bindable — use null explicitly
    db.prepare("UPDATE deliveries SET status = 'picked_up', pickup_at = ?, notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END WHERE id = ?").run(now, notes, notes, delivery.id);
    db.prepare("UPDATE food_posts SET status = 'picked_up', updated_at = datetime('now') WHERE id = ?").run(delivery.post_id);
    notify(delivery.donor_id, '🚗 Food Picked Up!', `Your "${delivery.food_name}" has been picked up by the volunteer.`, 'info');
  } else if (next === 'delivered') {
    if (receiverName.length > MAX_RECEIVER_NAME_LENGTH) {
      return res.status(400).json({ error: `receiver_name must be ${MAX_RECEIVER_NAME_LENGTH} characters or less` });
    }
    if (proofImage.length > MAX_PROOF_IMAGE_LENGTH) {
      return res.status(400).json({ error: 'proof_image is too large' });
    }
    db.prepare(`
      UPDATE deliveries SET
        status = 'delivered',
        delivered_at = ?,
        notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
        receiver_name = CASE WHEN ? IS NOT NULL THEN ? ELSE receiver_name END,
        proof_image = CASE WHEN ? IS NOT NULL THEN ? ELSE proof_image END
      WHERE id = ?
    `).run(
      now,
      notes, notes,
      receiverName || null, receiverName || null,
      proofImage || null, proofImage || null,
      delivery.id
    );
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

// POST /api/deliveries/:id/review — donor/volunteer reviews the opposite participant
router.post('/:id/review', authenticate, (req, res) => {
  const deliveryId = parseInt(req.params.id, 10);
  const parsedRating = Number(req.body.rating);
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

  if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
    return res.status(400).json({ error: 'Invalid delivery id' });
  }
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }
  if (note.length > MAX_REVIEW_NOTE_LENGTH) {
    return res.status(400).json({ error: `note must be ${MAX_REVIEW_NOTE_LENGTH} characters or less` });
  }

  const delivery = db.prepare(`
    SELECT d.id, d.status, d.volunteer_id, fp.donor_id, fp.food_name
    FROM deliveries d
    JOIN food_posts fp ON fp.id = d.post_id
    WHERE d.id = ?
  `).get(deliveryId);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.status !== 'delivered') {
    return res.status(400).json({ error: 'Reviews are allowed only after delivery is completed' });
  }

  const isDonor = req.user.id === delivery.donor_id;
  const isVolunteer = req.user.id === delivery.volunteer_id;
  if (!isDonor && !isVolunteer) {
    return res.status(403).json({ error: 'Only delivery participants can submit reviews' });
  }

  const existing = db.prepare('SELECT id FROM delivery_reviews WHERE delivery_id = ? AND reviewer_id = ?')
    .get(deliveryId, req.user.id);
  if (existing) return res.status(409).json({ error: 'You already reviewed this delivery' });

  const revieweeId = isDonor ? delivery.volunteer_id : delivery.donor_id;
  const result = db.prepare(`
    INSERT INTO delivery_reviews (delivery_id, reviewer_id, reviewee_id, rating, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(deliveryId, req.user.id, revieweeId, parsedRating, note || null);

  notify(
    revieweeId,
    '⭐ New Delivery Rating',
    `${req.user.name} rated your "${delivery.food_name}" delivery experience.`,
    'info'
  );

  const review = db.prepare(`
    SELECT id, delivery_id, reviewer_id, reviewee_id, rating, note, created_at
    FROM delivery_reviews
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(review);
});

// POST /api/deliveries/:id/report — donor/volunteer reports issue with the opposite participant
router.post('/:id/report', authenticate, (req, res) => {
  const deliveryId = parseInt(req.params.id, 10);
  const category = typeof req.body.category === 'string' ? req.body.category.trim().toLowerCase() : '';
  const details = typeof req.body.details === 'string' ? req.body.details.trim() : '';

  if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
    return res.status(400).json({ error: 'Invalid delivery id' });
  }
  if (!REPORT_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${REPORT_CATEGORIES.join(', ')}` });
  }
  if (!details) return res.status(400).json({ error: 'details are required' });
  if (details.length > MAX_REPORT_DETAILS_LENGTH) {
    return res.status(400).json({ error: `details must be ${MAX_REPORT_DETAILS_LENGTH} characters or less` });
  }

  const delivery = db.prepare(`
    SELECT d.id, d.volunteer_id, fp.donor_id, fp.food_name
    FROM deliveries d
    JOIN food_posts fp ON fp.id = d.post_id
    WHERE d.id = ?
  `).get(deliveryId);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const isDonor = req.user.id === delivery.donor_id;
  const isVolunteer = req.user.id === delivery.volunteer_id;
  if (!isDonor && !isVolunteer) {
    return res.status(403).json({ error: 'Only delivery participants can report issues' });
  }

  const reportedUserId = isDonor ? delivery.volunteer_id : delivery.donor_id;
  const result = db.prepare(`
    INSERT INTO issue_reports (delivery_id, reporter_id, reported_user_id, category, details, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `).run(deliveryId, req.user.id, reportedUserId, category, details);

  notify(
    reportedUserId,
    '⚠️ Issue Reported',
    `An issue was reported on delivery "${delivery.food_name}". Our team will review this signal.`,
    'info'
  );

  const report = db.prepare(`
    SELECT id, delivery_id, reporter_id, reported_user_id, category, details, status, created_at
    FROM issue_reports
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(report);
});

module.exports = router;
