const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/users/:id/reputation
router.get('/:id/reputation', authenticate, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) return res.status(404).json({ error: 'User not found' });

  const rep = db.prepare(`
    SELECT avg_rating, rating_count, open_reports_30d, under_review
    FROM user_reputation
    WHERE user_id = ?
  `).get(userId);

  res.json({
    avg_rating: Number(rep?.avg_rating || 0),
    rating_count: Number(rep?.rating_count || 0),
    under_review: Boolean(rep?.under_review)
  });
});

module.exports = router;
