const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/index');
require('dotenv').config();

router.post('/register', async(req,res) => {
  const { name, email, password} = req.body;

  if(!name || !email || !password){
    return res.status(400).json({message: 'Name, email and password are required.'})
  }
  try{
    const existing=await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if(existing.rows.length > 0){
      return res.status(400).json({message: 'Email already registered. Please login.'});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password) 
      VALUES ($1,$2,$3)
      RETURNING id, name, email`,
      [name,email,hashedPassword]
    );

    const user=result.rows[0];

    const token=jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      {expiresIn: '7d'}
    );

    res.status(201).json({
      message: 'Account created successfuly',
      user: {id:user.id, name:user.name, email: user.email},
      token,
    });
  } catch(err){
    console.error('Register error:', err);
    res.status(500).json({message: 'Server error. Please try again.'});
  }
});

// login
router.post('/login',async(req,res) => {
  const {email, password} = req.body;

  if(!email || !password){
    return res.status(400).json({message: 'Email and password are required.'});
  }

  try{
    // find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length===0){
      return res.status(400).json({message: 'No account found with this email.'});
    }

    const user = result.rows[0];

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(400).json({message: 'incorrect password. please try again'});
    }

    // generate token
    const token = jwt.sign(
      {id: user.id, email:user.email, name:user.name},
      process.env.JWT_SECRET,
      {expiresIn: '7d'}
    );

    res.json({
      message: 'Login successful',
      user: {id:user.id, name:user.name, email:user.email},
      token,
    });
  } catch (err){
    console.error('Login error:',err);
    res.status(500).json({message: 'Server error. Please try again.'});
  }
});

// get current user
// ── GET CURRENT USER ──
router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, age, monthly_income,
       investment_horizon, monthly_sip_budget, risk_appetite, risk_score
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── UPDATE PROFILE (Onboarding) ──
router.put('/profile', require('../middleware/authMiddleware'), async (req, res) => {
  const {
    age,
    monthly_income,
    investment_horizon,
    monthly_sip_budget,
    risk_appetite,
    goals
  } = req.body;

  try {
    // Update user profile
    await pool.query(
      `UPDATE users SET
        age = $1,
        monthly_income = $2,
        investment_horizon = $3,
        monthly_sip_budget = $4,
        risk_appetite = $5
       WHERE id = $6`,
      [age, monthly_income, investment_horizon, monthly_sip_budget, risk_appetite, req.user.id]
    );

    // Delete old goals and re-insert
    await pool.query('DELETE FROM user_goals WHERE user_id = $1', [req.user.id]);

    if (goals && goals.length > 0) {
      for (const goal of goals) {
        await pool.query(
          'INSERT INTO user_goals (user_id, goal_name) VALUES ($1, $2)',
          [req.user.id, goal]
        );
      }
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (err) {

    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
