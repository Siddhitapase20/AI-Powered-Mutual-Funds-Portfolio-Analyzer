const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/authMiddleware');
require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

// ── BUILD PROMPT FROM USER DATA ──
async function buildUserContext(userId) {
  const userResult = await pool.query(
    `SELECT u.name, u.age, u.monthly_income, u.investment_horizon,
            u.monthly_sip_budget, u.risk_appetite, u.risk_score,
            array_agg(g.goal_name) as goals
     FROM users u
     LEFT JOIN user_goals g ON g.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  const fundsResult = await pool.query(
    `SELECT fund_name, category, invested_amount, current_value
     FROM portfolio_funds WHERE user_id = $1`,
    [userId]
  );

  const user = userResult.rows[0];
  const funds = fundsResult.rows;
  if (!user) {
  return {
    user: {},
    funds: [],
    totalInvested: 0,
    currentValue: 0,
    context: "No user profile available."
  };
}

  const totalInvested = funds.reduce((s, f) => s + parseFloat(f.invested_amount), 0);
  const currentValue = funds.reduce((s, f) => s + parseFloat(f.current_value || f.invested_amount), 0);

  return {
    user,
    funds,
    totalInvested,
    currentValue,
    context: `
Investor Profile:
- Name: ${user?.name}
- Age: ${user?.age} years
- Monthly income: ₹${user?.monthly_income}
- Investment horizon: ${user?.investment_horizon}
- Monthly SIP budget: ₹${user?.monthly_sip_budget}
- Risk appetite: ${user?.risk_appetite}
- Goals: ${user?.goals?.filter(Boolean).join(', ') || 'Not specified'}

Current Portfolio (${funds.length} funds, Total: ₹${totalInvested.toLocaleString('en-IN')}):
${funds.map(f => `- ${f.fund_name} (${f.category}): Invested ₹${parseFloat(f.invested_amount).toLocaleString('en-IN')}, Current ₹${parseFloat(f.current_value || f.invested_amount).toLocaleString('en-IN')}`).join('\n') || 'No funds added yet'}
    `.trim()
  };
}

async function callGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);

    if (!result.response) {
      throw new Error("No response from Gemini");
    }

    return result.response.text();

  } catch (error) {
    console.error("Gemini Error:", error.message);
    throw new Error("Gemini API error");
  }
}

// ── GET AI RECOMMENDATIONS ──
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { context } = await buildUserContext(req.user.id);

    const prompt = `You are an expert Indian mutual fund advisor. Analyze this investor profile and provide specific recommendations.

${context}

Provide:
1. PORTFOLIO ASSESSMENT — Brief analysis of current allocation
2. RECOMMENDED FUNDS — Suggest 4 specific Indian mutual funds with fund house names, category, expected return range, and why each suits this investor
3. SUGGESTED ALLOCATION — Ideal equity/debt/hybrid % split
4. SIP STRATEGY — How to split monthly SIP across funds
5. KEY RISKS — 2-3 important risk points
6. TAX ANGLE — ELSS or 80C recommendations

Be specific with real Indian fund names (Mirae, Axis, HDFC, SBI, Parag Parikh, etc).
Format your response clearly with these section headers.
End with: DISCLAIMER: This is AI-generated advice for informational purposes only. Not SEBI-registered financial advice.`;

    const recommendation = await callGemini(prompt);

    // Save recommendation to DB
    await pool.query(
      'INSERT INTO ai_recommendations (user_id, recommendation) VALUES ($1, $2)',
      [req.user.id, recommendation]
    );

    res.json({ recommendation });

  } catch (err) {
    console.error('AI recommendations error:', err);
    res.status(500).json({ message: 'AI analysis failed. Please try again.' });
  }
});

// ── GET AI INSIGHTS (for dashboard) ──
router.get('/insights', auth, async (req, res) => {
  try {
    const { funds, totalInvested, context } = await buildUserContext(req.user.id);

    if (funds.length === 0) {
      return res.json({
        insights: [
          { icon: '📌', title: 'Get Started', text: 'Add your mutual funds to get personalized AI insights and recommendations.' }
        ]
      });
    }

    const prompt = `You are an expert Indian mutual fund advisor. Based on this portfolio, generate exactly 3 short investment insights.

${context}

Return ONLY a JSON array with exactly 3 objects. Each object must have:
- icon: one relevant emoji
- title: 2-3 word title in CAPS
- text: 1-2 sentence insight, specific and actionable

Example format:
[
  {"icon": "⚠️", "title": "OVERLAP ALERT", "text": "Your insight here."},
  {"icon": "📈", "title": "GROWTH TIP", "text": "Your insight here."},
  {"icon": "💰", "title": "TAX SAVING", "text": "Your insight here."}
]

Return ONLY the JSON array. No other text.`;

    const raw = await callGemini(prompt);

    // Parse JSON safely
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const insights = JSON.parse(cleaned);

    res.json({ insights });

  } catch (err) {
    console.error('AI insights error:', err);
    // Fallback insights if AI fails
    res.json({
      insights: [
        { icon: '📊', title: 'PORTFOLIO READY', text: 'Your portfolio data is loaded. Click Re-analyze for fresh AI insights.' },
        { icon: '🎯', title: 'SET YOUR GOALS', text: 'Complete your investor profile to get personalized fund recommendations.' },
        { icon: '📈', title: 'TRACK RETURNS', text: 'Add more funds to your portfolio for a complete diversification analysis.' },
      ]
    });
  }
});

// ── AI CHATBOT ──
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const { context } = await buildUserContext(req.user.id);

    const prompt = `You are FundSense AI, an expert Indian mutual fund advisor chatbot. You have access to this investor's portfolio data:

${context}

The investor asks: "${message}"

Answer in 2-3 sentences. Be specific, practical, and reference their actual portfolio data when relevant.
Use Indian mutual fund terminology (XIRR, CAGR, NAV, SIP, ELSS, etc.).
End with a brief disclaimer if giving specific fund advice.`;

    const reply = await callGemini(prompt);
    res.json({ reply });

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ message: 'AI response failed. Please try again.' });
  }
});

// ── RISK PROFILE ANALYSIS ──
router.post('/risk-analysis', auth, async (req, res) => {
  const { answers, totalScore } = req.body;

  try {
    let riskLevel = 'Moderate';
    let allocation = { equity: 60, debt: 25, hybrid: 15 };

    if (totalScore <= 8) {
      riskLevel = 'Conservative';
      allocation = { equity: 30, debt: 55, hybrid: 15 };
    } else if (totalScore <= 14) {
      riskLevel = 'Moderate';
      allocation = { equity: 60, debt: 25, hybrid: 15 };
    } else {
      riskLevel = 'Aggressive';
      allocation = { equity: 80, debt: 10, hybrid: 10 };
    }

    // Save risk profile
    await pool.query(
      `INSERT INTO risk_profiles (user_id, answers, total_score, risk_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET answers = $2, total_score = $3, risk_level = $4, created_at = NOW()`,
      [req.user.id, JSON.stringify(answers), totalScore, riskLevel]
    );

    // Update user risk score
    await pool.query(
      'UPDATE users SET risk_score = $1, risk_appetite = $2 WHERE id = $3',
      [totalScore, riskLevel, req.user.id]
    );

    res.json({ riskLevel, totalScore, allocation });

  } catch (err) {
    console.error('Risk analysis error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET PREVIOUS RECOMMENDATIONS ──
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT recommendation, created_at
       FROM ai_recommendations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({ history: result.rows });

  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;