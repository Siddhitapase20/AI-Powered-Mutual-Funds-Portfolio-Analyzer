const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

// ── CREATE GOAL ──
router.post('/', auth, async (req, res) => {
  const { goal_name, target_amount, target_date, monthly_sip } = req.body;

  if (!goal_name || !target_amount || !target_date) {
    return res.status(400).json({ message: 'Goal name, target amount and date are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO financial_goals (user_id, goal_name, target_amount, target_date, monthly_sip)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, goal_name, target_amount, target_date, monthly_sip || 0]
    );
    res.status(201).json({ goal: result.rows[0] });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET ALL GOALS ──
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY target_date ASC',
      [req.user.id]
    );

    const portfolioRes = await pool.query(
      'SELECT SUM(current_value) as total FROM portfolio_funds WHERE user_id = $1',
      [req.user.id]
    );

    const totalPortfolio = parseFloat(portfolioRes.rows[0]?.total || 0);

    const goals = result.rows.map(g => {
      const target = parseFloat(g.target_amount);
      const current = parseFloat(g.current_amount) || (totalPortfolio / result.rows.length);
      const progress = Math.min((current / target) * 100, 100).toFixed(1);
      const today = new Date();
      const targetDate = new Date(g.target_date);
      const monthsLeft = Math.max(0, Math.round((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));
      const yearsLeft = (monthsLeft / 12).toFixed(1);

      // Required SIP to reach goal (assuming 12% p.a.)
      const mr = 0.12 / 12;
      const n = monthsLeft;
      const requiredSIP = n > 0
        ? Math.round((target * mr) / ((Math.pow(1 + mr, n) - 1) * (1 + mr)))
        : 0;

      return {
        ...g,
        current_amount: current,
        progress: parseFloat(progress),
        monthsLeft,
        yearsLeft,
        requiredSIP,
        isOnTrack: parseFloat(g.monthly_sip) >= requiredSIP * 0.9,
      };
    });

    res.json({ goals, totalPortfolio });
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── UPDATE GOAL ──
router.put('/:id', auth, async (req, res) => {
  const { goal_name, target_amount, target_date, monthly_sip, current_amount } = req.body;

  try {
    const check = await pool.query(
      'SELECT id FROM financial_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    const result = await pool.query(
      `UPDATE financial_goals SET
        goal_name = COALESCE($1, goal_name),
        target_amount = COALESCE($2, target_amount),
        target_date = COALESCE($3, target_date),
        monthly_sip = COALESCE($4, monthly_sip),
        current_amount = COALESCE($5, current_amount)
       WHERE id = $6 RETURNING *`,
      [goal_name, target_amount, target_date, monthly_sip, current_amount, req.params.id]
    );

    res.json({ goal: result.rows[0] });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE GOAL ──
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Goal deleted.' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;