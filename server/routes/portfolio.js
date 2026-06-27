const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

// ── GET ALL FUNDS ──
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM portfolio_funds
       WHERE user_id = $1
       ORDER BY added_at DESC`,
      [req.user.id]
    );
    res.json({ funds: result.rows });
  } catch (err) {
    console.error('Get portfolio error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── ADD FUND ──
router.post('/', auth, async (req, res) => {
  const { fund_name, category, invested_amount, units } = req.body;

  if (!fund_name || !category || !invested_amount) {
    return res.status(400).json({ message: 'Fund name, category and invested amount are required.' });
  }

  try {
    // Try to find NAV for this fund
    const navResult = await pool.query(
      `SELECT nav FROM nav_data
       WHERE LOWER(scheme_name) LIKE LOWER($1)
       ORDER BY nav_date DESC LIMIT 1`,
      [`%${fund_name.split(' ')[0]}%`]
    );

    const nav = navResult.rows[0]?.nav || 0;
    const fundUnits = units || (nav > 0 ? invested_amount / nav : 0);
    const current_value = nav > 0 ? fundUnits * nav : invested_amount;

    const result = await pool.query(
      `INSERT INTO portfolio_funds
        (user_id, fund_name, category, invested_amount, units, nav, current_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, fund_name, category, invested_amount, fundUnits, nav, current_value]
    );

    res.status(201).json({
      message: 'Fund added successfully',
      fund: result.rows[0]
    });

  } catch (err) {
    console.error('Add fund error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── UPDATE FUND ──
router.put('/:id', auth, async (req, res) => {
  const { fund_name, category, invested_amount } = req.body;
  const fundId = req.params.id;

  try {
    // Make sure fund belongs to this user
    const check = await pool.query(
      'SELECT id FROM portfolio_funds WHERE id = $1 AND user_id = $2',
      [fundId, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Fund not found.' });
    }

    const result = await pool.query(
      `UPDATE portfolio_funds SET
        fund_name = $1,
        category = $2,
        invested_amount = $3
       WHERE id = $4
       RETURNING *`,
      [fund_name, category, invested_amount, fundId]
    );

    res.json({ message: 'Fund updated', fund: result.rows[0] });

  } catch (err) {
    console.error('Update fund error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE FUND ──
router.delete('/:id', auth, async (req, res) => {
  const fundId = req.params.id;

  try {
    const check = await pool.query(
      'SELECT id FROM portfolio_funds WHERE id = $1 AND user_id = $2',
      [fundId, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Fund not found.' });
    }

    await pool.query('DELETE FROM portfolio_funds WHERE id = $1', [fundId]);
    res.json({ message: 'Fund deleted successfully' });

  } catch (err) {
    console.error('Delete fund error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── PORTFOLIO SUMMARY ──
router.get('/summary', auth, async (req, res) => {
  try {
    const fundsResult = await pool.query(
      'SELECT * FROM portfolio_funds WHERE user_id = $1',
      [req.user.id]
    );

    const funds = fundsResult.rows;

    if (funds.length === 0) {
      return res.json({
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        xirr: 0,
        fundCount: 0,
        healthScore: 0,
        allocation: {}
      });
    }

    const totalInvested = funds.reduce((sum, f) => sum + parseFloat(f.invested_amount), 0);
    const currentValue = funds.reduce((sum, f) => sum + parseFloat(f.current_value || f.invested_amount), 0);
    const totalReturn = ((currentValue - totalInvested) / totalInvested) * 100;

    // Allocation by category
    const allocation = {};
    funds.forEach(f => {
      allocation[f.category] = (allocation[f.category] || 0) + parseFloat(f.invested_amount);
    });

    // Simple health score calculation
    const equityPct = ((allocation['Equity'] || 0) + (allocation['ELSS'] || 0) + (allocation['Index'] || 0)) / totalInvested * 100;
    const debtPct = (allocation['Debt'] || 0) / totalInvested * 100;
    const diversificationScore = funds.length >= 3 ? 30 : funds.length * 10;
    const allocationScore = equityPct > 0 && debtPct > 0 ? 25 : 10;
    const returnScore = totalReturn > 15 ? 25 : totalReturn > 10 ? 20 : totalReturn > 5 ? 15 : 10;
    const healthScore = Math.min(100, diversificationScore + allocationScore + returnScore + 10);

    res.json({
      totalInvested: Math.round(totalInvested),
      currentValue: Math.round(currentValue),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      xirr: parseFloat((totalReturn * 0.9).toFixed(1)),
      fundCount: funds.length,
      healthScore: Math.round(healthScore),
      allocation,
      funds,
    });

  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── OVERLAP ANALYSIS ──
router.get('/overlap', auth, async (req, res) => {
  try {
    const fundsResult = await pool.query(
      'SELECT fund_name, category FROM portfolio_funds WHERE user_id = $1',
      [req.user.id]
    );

    const funds = fundsResult.rows;

    // Mock overlap data — replace with real holdings data in production
    const overlapData = [];
    for (let i = 0; i < funds.length; i++) {
      for (let j = i + 1; j < funds.length; j++) {
        const bothEquity =
          ['Equity', 'ELSS', 'Index'].includes(funds[i].category) &&
          ['Equity', 'ELSS', 'Index'].includes(funds[j].category);

        overlapData.push({
          fund1: funds[i].fund_name,
          fund2: funds[j].fund_name,
          overlapPercent: bothEquity ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 10),
        });
      }
    }

    res.json({ overlap: overlapData });

  } catch (err) {
    console.error('Overlap error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;