const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'foodshare_secret_2024';

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
        }
        next();
    };
}

module.exports = { authenticate, requireRole, JWT_SECRET };
