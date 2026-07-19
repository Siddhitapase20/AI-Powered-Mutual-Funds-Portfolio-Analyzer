const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');

const MF_API = 'https://api.mfapi.in';

// ── SEARCH FUNDS BY NAME ──
router.get('/search', auth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Enter at least 2 characters.' });
  }

  try {
    // Get all funds from MF API
    const response = await fetch(`${MF_API}/mf/search?q=${encodeURIComponent(q)}`);
    const data = await response.json();

    // Return top 10 results
    const results = data.slice(0, 10).map(f => ({
      schemeCode: f.schemeCode,
      schemeName: f.schemeName,
    }));

    res.json({ funds: results });
  } catch (err) {
    console.error('Fund search error:', err);
    res.status(500).json({ message: 'Search failed. Please try again.' });
  }
});

// ── GET LIVE NAV + DETAILS FOR A FUND ──
router.get('/details/:schemeCode', auth, async (req, res) => {
  const { schemeCode } = req.params;

  try {
    const response = await fetch(`${MF_API}/mf/${schemeCode}`);
    const data = await response.json();

    if (!data.meta) {
      return res.status(404).json({ message: 'Fund not found.' });
    }

    const latestNAV = data.data[0];
    const weekAgoNAV = data.data[6];
    const monthAgoNAV = data.data[29];
    const threeMonthNAV = data.data[89];
    const yearAgoNAV = data.data[364];
    const threeYearNAV = data.data[365 * 3];
    const fiveYearNAV = data.data[365 * 5];

    const calcReturn = (oldNav, newNav) => {
      if (!oldNav || !newNav) return null;
      return (((parseFloat(newNav.nav) - parseFloat(oldNav.nav)) / parseFloat(oldNav.nav)) * 100).toFixed(2);
    };

    const calcCAGR = (oldNav, newNav, years) => {
      if (!oldNav || !newNav) return null;
      const old = parseFloat(oldNav.nav);
      const curr = parseFloat(newNav.nav);
      return (((curr / old) ** (1 / years) - 1) * 100).toFixed(2);
    };

    res.json({
      meta: {
        schemeCode: data.meta.scheme_code,
        schemeName: data.meta.scheme_name,
        fundHouse: data.meta.fund_house,
        schemeType: data.meta.scheme_type,
        schemeCategory: data.meta.scheme_category,
      },
      nav: {
        current: parseFloat(latestNAV.nav),
        date: latestNAV.date,
      },
      returns: {
        '1W': calcReturn(weekAgoNAV, latestNAV),
        '1M': calcReturn(monthAgoNAV, latestNAV),
        '3M': calcReturn(threeMonthNAV, latestNAV),
        '1Y': calcCAGR(yearAgoNAV, latestNAV, 1),
        '3Y': calcCAGR(threeYearNAV, latestNAV, 3),
        '5Y': calcCAGR(fiveYearNAV, latestNAV, 5),
      },
      historicalNAV: data.data.slice(0, 365),
    });

  } catch (err) {
    console.error('Fund details error:', err);
    res.status(500).json({ message: 'Could not fetch fund data.' });
  }
});

// ── UPDATE CURRENT VALUES IN PORTFOLIO USING LIVE NAV ──
router.post('/refresh-portfolio', auth, async (req, res) => {
  try {
    const funds = await pool.query(
      'SELECT id, fund_name, scheme_code, units FROM portfolio_funds WHERE user_id = $1',
      [req.user.id]
    );

    let updated = 0;

    for (const fund of funds.rows) {
      if (!fund.scheme_code) continue;

      try {
        const response = await fetch(`${MF_API}/mf/${fund.scheme_code}`);
        const data = await response.json();
        const latestNAV = parseFloat(data.data[0]?.nav || 0);

        if (latestNAV > 0 && fund.units > 0) {
          const currentValue = latestNAV * parseFloat(fund.units);
          await pool.query(
            'UPDATE portfolio_funds SET nav = $1, current_value = $2 WHERE id = $3',
            [latestNAV, currentValue, fund.id]
          );
          updated++;
        }
      } catch {
        // Skip fund if API fails for it
        continue;
      }
    }

    res.json({ message: `Updated ${updated} funds with live NAV.`, updated });
  } catch (err) {
    console.error('Refresh portfolio error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET MARKET OVERVIEW (top performing categories today) ──
router.get('/market-overview', auth, async (req, res) => {
  try {
    // These are popular fund scheme codes for market pulse
    const popularFunds = [
      { code: '120503', name: 'Mirae Asset Large Cap', category: 'Large Cap' },
      { code: '118989', name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap' },
      { code: '120594', name: 'Axis Midcap Fund', category: 'Mid Cap' },
      { code: '125494', name: 'SBI Small Cap Fund', category: 'Small Cap' },
      { code: '120505', name: 'Mirae Asset ELSS Tax Saver', category: 'ELSS' },
      { code: '119568', name: 'HDFC Short Term Debt', category: 'Debt' },
    ];

    const results = [];

    for (const fund of popularFunds) {
      try {
        const response = await fetch(`${MF_API}/mf/${fund.code}`);
        const data = await response.json();
        const latest = data.data[0];
        const yesterday = data.data[1];

        const dayChange = yesterday
          ? (((parseFloat(latest.nav) - parseFloat(yesterday.nav)) / parseFloat(yesterday.nav)) * 100).toFixed(3)
          : '0.000';

        results.push({
          name: fund.name,
          category: fund.category,
          nav: parseFloat(latest.nav),
          date: latest.date,
          dayChange: parseFloat(dayChange),
        });
      } catch {
        continue;
      }
    }

    res.json({ funds: results });
  } catch (err) {
    console.error('Market overview error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;