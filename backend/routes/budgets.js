const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/db');
const { isProd } = require('../config/env');

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', ...(isProd ? {} : { error: err.message }) });
};

// Get all budgets with spending for the CURRENT month (and current year)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN transactions t ON t.category = b.category
         AND t.user_id = b.user_id AND t.type = 'expense'
         AND t.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND t.date <  DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.category`,
      [req.user.id]
    );
    res.json(rows.map((r) => ({ ...r, spent: Number(r.spent), limit_amount: Number(r.limit_amount) })));
  } catch (err) {
    serverError(res, err);
  }
});

// Set (create or update) a budget
router.post('/', auth, async (req, res) => {
  const category = String(req.body.category || '').trim();
  const limit_amount = Number(req.body.limit_amount);

  if (!category || category.length > 50) return res.status(400).json({ message: 'Category is required' });
  if (!Number.isFinite(limit_amount) || limit_amount <= 0 || limit_amount > 99999999.99) {
    return res.status(400).json({ message: 'Limit must be a positive number' });
  }

  try {
    await db.query(
      `INSERT INTO budgets (user_id, category, limit_amount)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)`,
      [req.user.id, category, limit_amount]
    );
    res.status(201).json({ message: 'Budget set successfully' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
