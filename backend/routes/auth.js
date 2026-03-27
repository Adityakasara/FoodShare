const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/schema');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { name, email, password, role, phone, address } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    if (!['donor', 'volunteer'].includes(role)) {
        return res.status(400).json({ error: 'role must be donor or volunteer' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashed, role, phone || null, address || null);

    const token = jwt.sign({ id: result.lastInsertRowid, name, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, role } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
    const user = db.prepare('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

module.exports = router;
