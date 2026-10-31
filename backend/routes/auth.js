const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, isProd } = require('../config/env');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (id, email) => jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', ...(isProd ? {} : { error: err.message }) });
};

// Register
router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || name.length > 100) return res.status(400).json({ message: 'Please enter your name' });
  if (!EMAIL_RE.test(email) || email.length > 100) return res.status(400).json({ message: 'Please enter a valid email' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );
    res.status(201).json({
      token: signToken(result.insertId, email),
      user: { id: result.insertId, name, email },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already registered' });
    serverError(res, err);
  }
});

// Login
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({
      token: signToken(rows[0].id, rows[0].email),
      user: { id: rows[0].id, name: rows[0].name, email: rows[0].email },
    });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
