const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'super-secret-key-for-ml-roadmap'; // In production, use env var

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS progress (
            user_id INTEGER PRIMARY KEY,
            tasks TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

// Routes
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Initialize empty progress for new user
            db.run(`INSERT INTO progress (user_id, tasks) VALUES (?, ?)`, [this.lastID, '[]']);
            
            const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY, { expiresIn: '7d' });
            res.json({ message: 'User created successfully', token, username });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ message: 'Logged in successfully', token, username: user.username });
    });
});

app.get('/api/progress', authenticateToken, (req, res) => {
    db.get(`SELECT tasks FROM progress WHERE user_id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const tasks = row ? JSON.parse(row.tasks) : [];
        res.json({ tasks });
    });
});

app.post('/api/progress', authenticateToken, (req, res) => {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Tasks must be an array' });

    const tasksJson = JSON.stringify(tasks);
    db.run(`UPDATE progress SET tasks = ? WHERE user_id = ?`, [tasksJson, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Progress saved successfully' });
    });
});

// Fallback for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
