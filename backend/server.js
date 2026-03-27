const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB first
require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/support-centers', require('./routes/supportCenters'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Catch-all: serve frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log(`\n🍽️  FoodShare server running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   iPhone:  http://${ip}:${PORT}  ←← open this on your iPhone`);
    console.log(`   API:     http://${ip}:${PORT}/api\n`);
});
