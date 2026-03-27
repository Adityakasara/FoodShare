const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — current user's notifications
router.get('/', authenticate, (req, res) => {
    const rows = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
    res.json(rows);
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, (req, res) => {
    const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: row.count });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, (req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, (req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All marked as read' });
});

module.exports = router;
