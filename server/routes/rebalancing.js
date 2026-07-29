const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

// ── GET REBALANCING ANALYSIS ──
router.get('/analysis', auth, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT risk_appetite, age, investment_horizon FROM users WHERE id = $1',
      [req.user.id]
    );

    const fundsRes = await pool.query(
      `SELECT fund_name, category, sub_category,
       invested_amount, current_value
       FROM portfolio_funds WHERE user_id = $1`,
      [req.user.id]
    );

    const user = userRes.rows[0];
    const funds = fundsRes.rows;

    if (funds.length === 0) {
      return res.json({ needsRebalancing: false, message: 'Add funds to get rebalancing analysis.' });
    }

    const total = funds.reduce((s, f) => s + parseFloat(f.current_value || f.invested_amount), 0);

    // Current allocation
    const current = {};
    funds.forEach(f => {
      const cat = f.category;
      current[cat] = (current[cat] || 0) + parseFloat(f.current_value || f.invested_amount);
    });

    const currentPct = {};
    Object.entries(current).forEach(([k, v]) => {
      currentPct[k] = parseFloat(((v / total) * 100).toFixed(1));
    });

    // Target allocation based on risk profile
    let target = { Equity: 60, Debt: 25, Hybrid: 15 };
    if (user?.risk_appetite === 'Conservative') {
      target = { Equity: 30, Debt: 55, Hybrid: 15 };
    } else if (user?.risk_appetite === 'Aggressive') {
      target = { Equity: 80, Debt: 10, Hybrid: 10 };
    }

    // Also consider age — rule of 100
    const age = parseInt(user?.age || 30);
    const debtByAge = Math.min(age, 40);
    target.Debt = Math.max(target.Debt, debtByAge);
    target.Equity = 100 - target.Debt - (target.Hybrid || 10);

    // Find drift
    const alerts = [];
    let needsRebalancing = false;
    const DRIFT_THRESHOLD = 5; // alert if more than 5% off

    Object.entries(target).forEach(([cat, targetPct]) => {
      const actualPct = currentPct[cat] || 0;
      const drift = actualPct - targetPct;

      if (Math.abs(drift) > DRIFT_THRESHOLD) {
        needsRebalancing = true;
        alerts.push({
          category: cat,
          current: actualPct,
          target: targetPct,
          drift: parseFloat(drift.toFixed(1)),
          action: drift > 0 ? 'Reduce' : 'Increase',
          severity: Math.abs(drift) > 10 ? 'high' : 'medium',
          amountToShift: parseFloat(((Math.abs(drift) / 100) * total).toFixed(0)),
        });
      }
    });

    // Specific fund-level suggestions
    const suggestions = alerts.map(a => {
      if (a.action === 'Reduce') {
        return `Reduce ${a.category} exposure by ₹${a.amountToShift.toLocaleString('en-IN')} (currently ${a.current}%, target ${a.target}%)`;
      } else {
        return `Add ₹${a.amountToShift.toLocaleString('en-IN')} more to ${a.category} funds (currently ${a.current}%, target ${a.target}%)`;
      }
    });

    res.json({
      needsRebalancing,
      currentAllocation: currentPct,
      targetAllocation: target,
      alerts,
      suggestions,
      totalPortfolioValue: total,
      riskProfile: user?.risk_appetite || 'Moderate',
    });

  } catch (err) {
    console.error('Rebalancing error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── TAX HARVESTING ANALYSIS ──
router.get('/tax', auth, async (req, res) => {
  try {
    const fundsRes = await pool.query(
      `SELECT pf.id, pf.fund_name, pf.category, pf.sub_category,
       pf.invested_amount, pf.current_value, pf.added_at,
       COALESCE(SUM(st.amount), 0) as sip_invested
       FROM portfolio_funds pf
       LEFT JOIN sip_transactions st ON st.fund_id = pf.id
       WHERE pf.user_id = $1
       GROUP BY pf.id`,
      [req.user.id]
    );

    const funds = fundsRes.rows;
    const today = new Date();
    const taxAnalysis = [];
    let totalLTCG = 0;
    let totalSTCG = 0;
    let potentialTaxSaving = 0;

    funds.forEach(f => {
      const invested = parseFloat(f.invested_amount);
      const current = parseFloat(f.current_value || invested);
      const gain = current - invested;
      const addedDate = new Date(f.added_at);
      const monthsHeld = Math.floor((today - addedDate) / (1000 * 60 * 60 * 24 * 30));
      const isLongTerm = monthsHeld >= 12;

      // Tax rates (India 2024)
      // LTCG: 10% above ₹1L per year (equity)
      // STCG: 15% (equity)
      // Debt: income tax slab rate regardless of holding

      const isEquity = ['Equity', 'ELSS', 'Index', 'Hybrid'].includes(f.category);
      let taxRate = 0;
      let taxType = '';

      if (isEquity) {
        if (isLongTerm) {
          taxRate = 0.10;
          taxType = 'LTCG';
          totalLTCG += Math.max(0, gain);
        } else {
          taxRate = 0.15;
          taxType = 'STCG';
          totalSTCG += Math.max(0, gain);
        }
      } else {
        taxRate = 0.30; // assume 30% slab for debt
        taxType = isLongTerm ? 'Debt LTCG' : 'Debt STCG';
      }

      const estimatedTax = gain > 0 ? gain * taxRate : 0;

      // Tax loss harvesting opportunity
      const harvestOpportunity = gain < 0 && isLongTerm
        ? Math.abs(gain) * 0.10
        : 0;

      potentialTaxSaving += harvestOpportunity;

      taxAnalysis.push({
        fund_name: f.fund_name,
        category: f.category,
        invested,
        current,
        gain: parseFloat(gain.toFixed(2)),
        gainPct: parseFloat(((gain / invested) * 100).toFixed(2)),
        monthsHeld,
        isLongTerm,
        taxType,
        taxRate: (taxRate * 100).toFixed(0),
        estimatedTax: parseFloat(estimatedTax.toFixed(2)),
        harvestOpportunity: parseFloat(harvestOpportunity.toFixed(2)),
      });
    });

    // LTCG exemption: first ₹1L is tax free
    const ltcgExemption = 100000;
    const taxableLTCG = Math.max(0, totalLTCG - ltcgExemption);
    const ltcgTax = taxableLTCG * 0.10;
    const stcgTax = totalSTCG * 0.15;
    const totalTaxLiability = ltcgTax + stcgTax;

    res.json({
      taxAnalysis,
      summary: {
        totalLTCG: parseFloat(totalLTCG.toFixed(2)),
        totalSTCG: parseFloat(totalSTCG.toFixed(2)),
        ltcgExemptionUsed: Math.min(totalLTCG, ltcgExemption),
        taxableLTCG: parseFloat(taxableLTCG.toFixed(2)),
        ltcgTax: parseFloat(ltcgTax.toFixed(2)),
        stcgTax: parseFloat(stcgTax.toFixed(2)),
        totalTaxLiability: parseFloat(totalTaxLiability.toFixed(2)),
        potentialTaxSaving: parseFloat(potentialTaxSaving.toFixed(2)),
      },
    });

  } catch (err) {
    console.error('Tax error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;