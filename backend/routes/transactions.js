const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/db');
const { isProd } = require('../config/env');

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', ...(isProd ? {} : { error: err.message }) });
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayISO = () => new Date().toISOString().slice(0, 10);

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    serverError(res, err);
  }
});

// Spending by category (declared before any "/:id" routes on purpose)
router.get('/by-category', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense'
       GROUP BY category ORDER BY total DESC`,
      [req.user.id]
    );
    res.json(rows.map((r) => ({ category: r.category, total: Number(r.total) })));
  } catch (err) {
    serverError(res, err);
  }
});

// Add transaction
router.post('/', auth, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const amount = Number(req.body.amount);
  const { type } = req.body;
  const category = String(req.body.category || '').trim();
  const date = req.body.date ? String(req.body.date).slice(0, 10) : todayISO();
  const note = req.body.note ? String(req.body.note).trim() : null;

  if (!title || title.length > 150) return res.status(400).json({ message: 'Title is required (max 150 characters)' });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999.99) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Type must be income or expense' });
  if (!category || category.length > 50) return res.status(400).json({ message: 'Category is required' });
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) return res.status(400).json({ message: 'Invalid date' });

  try {
    const [result] = await db.query(
      'INSERT INTO transactions (user_id, title, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, amount, type, category, date, note]
    );
    const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
