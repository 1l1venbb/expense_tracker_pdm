const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../database');

const router = express.Router();

function issueToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
}

router.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || password.length < 4
    ) {
        return res.status(400).json({
            message: 'Email and a password of at least 4 characters are required'
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        'INSERT INTO users (email, password) VALUES (?, ?)'
    ).run(normalizedEmail, hashedPassword);

    const userId = Number(result.lastInsertRowid);

    res.status(201).json({
        token: issueToken(userId),
        user: { id: userId, email: normalizedEmail }
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
        token: issueToken(user.id),
        user: { id: user.id, email: user.email }
    });
});

module.exports = router;
