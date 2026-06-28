const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

// ── SEARCH FUNDS ──
router.get('/search', auth, async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Search query too short.' });
  }

  try {
    const result = await pool.query(
      `SELECT scheme_code, scheme_name, nav, nav_date
       FROM nav_data
       WHERE LOWER(scheme_name) LIKE LOWER($1)
       ORDER BY scheme_name
       LIMIT 20`,
      [`%${q}%`]
    );

    res.json({ funds: result.rows });

  } catch (err) {
    console.error('Search funds error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET LATEST NAV ──
router.get('/nav/:schemeName', auth, async (req, res) => {
  const { schemeName } = req.params;

  try {
    const result = await pool.query(
      `SELECT scheme_name, nav, nav_date
       FROM nav_data
       WHERE LOWER(scheme_name) LIKE LOWER($1)
       ORDER BY nav_date DESC
       LIMIT 1`,
      [`%${schemeName}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fund not found in NAV database.' });
    }

    res.json({ fund: result.rows[0] });

  } catch (err) {
    console.error('Get NAV error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── FETCH LIVE NAV FROM AMFI (run this manually or via cron) ──
router.post('/sync-nav', async (req, res) => {
  try {
    const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
    const text = await response.text();
    const lines = text.split('\n');

    let synced = 0;

    for (const line of lines) {
      const parts = line.split(';');
      if (parts.length >= 5) {
        const schemeCode = parts[0]?.trim();
        const schemeName = parts[3]?.trim();
        const nav = parseFloat(parts[4]?.trim());
        const navDate = parts[5]?.trim();

        if (schemeCode && schemeName && !isNaN(nav)) {
          await pool.query(
            `INSERT INTO nav_data (scheme_code, scheme_name, nav, nav_date)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (scheme_code)
             DO UPDATE SET nav = $3, nav_date = $4, updated_at = NOW()`,
            [schemeCode, schemeName, nav, navDate || new Date()]
          );
          synced++;
        }
      }
    }

    res.json({ message: `NAV sync complete. ${synced} funds updated.` });

  } catch (err) {
    console.error('NAV sync error:', err);
    res.status(500).json({ message: 'NAV sync failed.' });
  }
});

// ── GET FUND PERFORMANCE DATA ──
router.get('/performance', auth, async (req, res) => {
  try {
    const fundsResult = await pool.query(
      'SELECT fund_name, category, invested_amount, current_value FROM portfolio_funds WHERE user_id = $1',
      [req.user.id]
    );

    // Performance data with mock returns — replace with real historical NAV in production
    const performance = fundsResult.rows.map(fund => ({
      name: fund.fund_name,
      category: fund.category,
      invested: parseFloat(fund.invested_amount),
      current: parseFloat(fund.current_value || fund.invested_amount),
      returns: {
        '1Y': (Math.random() * 15 + 8).toFixed(1),
        '3Y': (Math.random() * 12 + 10).toFixed(1),
        '5Y': (Math.random() * 10 + 12).toFixed(1),
      },
      expenseRatio: (Math.random() * 0.5 + 0.3).toFixed(2),
      sharpeRatio: (Math.random() * 0.8 + 0.8).toFixed(2),
    }));

    res.json({ performance });

  } catch (err) {
    console.error('Performance error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;