const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

// ── ADD SIP TRANSACTION ──
router.post('/add', auth, async (req, res) => {
  const { fund_id, amount, nav_at_purchase, transaction_date, transaction_type, notes } = req.body;

  if (!fund_id || !amount) {
    return res.status(400).json({ message: 'Fund and amount required.' });
  }

  try {
    // Verify fund belongs to user
    const fundCheck = await pool.query(
      'SELECT id, fund_name, invested_amount FROM portfolio_funds WHERE id = $1 AND user_id = $2',
      [fund_id, req.user.id]
    );

    if (fundCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Fund not found.' });
    }

    const units = nav_at_purchase ? (amount / nav_at_purchase).toFixed(4) : 0;

    // Insert transaction
    const result = await pool.query(
      `INSERT INTO sip_transactions (user_id, fund_id, amount, nav_at_purchase, units_purchased, transaction_date, transaction_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, fund_id, amount, nav_at_purchase || 0, units, transaction_date || new Date(), transaction_type || 'SIP', notes || '']
    );

    // Update total invested in portfolio_funds
    await pool.query(
      'UPDATE portfolio_funds SET invested_amount = invested_amount + $1 WHERE id = $2',
      [amount, fund_id]
    );

    res.status(201).json({ message: 'SIP transaction added', transaction: result.rows[0] });

  } catch (err) {
    console.error('Add SIP error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET ALL TRANSACTIONS FOR USER ──
router.get('/all', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.fund_name, p.category
       FROM sip_transactions s
       JOIN portfolio_funds p ON p.id = s.fund_id
       WHERE s.user_id = $1
       ORDER BY s.transaction_date DESC`,
      [req.user.id]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET TRANSACTIONS FOR ONE FUND ──
router.get('/fund/:fund_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sip_transactions
       WHERE user_id = $1 AND fund_id = $2
       ORDER BY transaction_date DESC`,
      [req.user.id, req.params.fund_id]
    );

    const transactions = result.rows;
    const totalInvested = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalUnits = transactions.reduce((s, t) => s + parseFloat(t.units_purchased || 0), 0);
    const avgNavCost = totalUnits > 0 ? (totalInvested / totalUnits).toFixed(2) : 0;

    res.json({ transactions, totalInvested, totalUnits, avgNavCost });
  } catch (err) {
    console.error('Get fund transactions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE TRANSACTION ──
router.delete('/:id', auth, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT * FROM sip_transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const txn = check.rows[0];

    // Reverse the invested amount
    await pool.query(
      'UPDATE portfolio_funds SET invested_amount = invested_amount - $1 WHERE id = $2',
      [txn.amount, txn.fund_id]
    );

    await pool.query('DELETE FROM sip_transactions WHERE id = $1', [req.params.id]);

    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── XIRR CALCULATION ──
router.get('/xirr/:fund_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT amount, transaction_date, units_purchased
       FROM sip_transactions
       WHERE user_id = $1 AND fund_id = $2
       ORDER BY transaction_date ASC`,
      [req.user.id, req.params.fund_id]
    );

    const fundResult = await pool.query(
      'SELECT current_value, fund_name FROM portfolio_funds WHERE id = $1',
      [req.params.fund_id]
    );

    if (result.rows.length === 0) {
      return res.json({ xirr: 0, message: 'No transactions found.' });
    }

    const transactions = result.rows;
    const currentValue = parseFloat(fundResult.rows[0]?.current_value || 0);
    const totalInvested = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    const absoluteReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0;

    // Simple CAGR approximation
    const firstDate = new Date(transactions[0].transaction_date);
    const today = new Date();
    const years = (today - firstDate) / (365.25 * 24 * 60 * 60 * 1000);
    const cagr = years > 0 ? (((currentValue / totalInvested) ** (1 / years) - 1) * 100).toFixed(2) : 0;

    res.json({
      xirr: cagr,
      absoluteReturn,
      totalInvested,
      currentValue,
      totalTransactions: transactions.length,
      firstInvestmentDate: firstDate,
    });

  } catch (err) {
    console.error('XIRR error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;