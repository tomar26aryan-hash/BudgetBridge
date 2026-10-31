const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/db');
const { isProd } = require('../config/env');

const MONTH_START = `DATE_FORMAT(CURDATE(), '%Y-%m-01')`;
const NEXT_MONTH_START = `DATE_ADD(${MONTH_START}, INTERVAL 1 MONTH)`;

router.get('/summary', auth, async (req, res) => {
  try {
    const [[totals]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND date >= ${MONTH_START} AND date < ${NEXT_MONTH_START}`,
      [req.user.id]
    );
    const [recent] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 5',
      [req.user.id]
    );
    const [monthly] = await db.query(
      `SELECT MONTH(date) AS month, type, SUM(amount) AS total
       FROM transactions
       WHERE user_id = ? AND date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
         AND date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)
       GROUP BY MONTH(date), type ORDER BY month`,
      [req.user.id]
    );

    const totalIncome = Number(totals.income);
    const totalExpense = Number(totals.expense);
    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      recentTransactions: recent,
      monthlyData: monthly.map((m) => ({ month: Number(m.month), type: m.type, total: Number(m.total) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', ...(isProd ? {} : { error: err.message }) });
  }
});

module.exports = router;
