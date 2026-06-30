import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Onboarding.css';

const ALL_GOALS = ['Wealth creation', 'Retirement', 'Tax saving (ELSS)', 'Child education', 'Home purchase'];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    age: '',
    monthly_income: '',
    investment_horizon: '3-5 years',
    monthly_sip_budget: '',
    risk_appetite: 'Moderate',
    goals: ['Wealth creation'],
  });

  const [funds, setFunds] = useState([]);
  const [fundForm, setFundForm] = useState({ fund_name: '', category: 'Equity', invested_amount: '' });

  const toggleGoal = (goal) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const addFund = () => {
    if (!fundForm.fund_name || !fundForm.invested_amount) return;
    setFunds([...funds, fundForm]);
    setFundForm({ fund_name: '', category: 'Equity', invested_amount: '' });
  };

  const removeFund = (index) => {
    setFunds(funds.filter((_, i) => i !== index));
  };

  const goNext = async () => {
    if (step === 1) {
      if (!profile.age || !profile.monthly_income) {
        setError('Please fill age and monthly income.');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      // Save profile
      await api.put('/auth/profile', profile);

      // Save each fund
      for (const fund of funds) {
        await api.post('/portfolio', fund);
      }

      // Sync NAV in background (don't block user)
      api.post('/funds/sync-nav').catch(() => {});

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="ob-wrap">
        <div className="ob-progress">
          <div className={`ob-step ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`} />
          <div className={`ob-step ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`} />
          <div className={`ob-step ${step === 3 ? 'active' : ''}`} />
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {/* STEP 1 — Profile */}
        {step === 1 && (
          <div className="fade-up">
            <h2 className="ob-title">Your investor profile</h2>
            <p className="ob-sub">Help us understand you before we suggest funds.</p>

            <div className="grid2">
              <div className="form-group">
                <label>Age</label>
                <input type="number" value={profile.age}
                  onChange={e => setProfile({ ...profile, age: e.target.value })} placeholder="e.g. 28" />
              </div>
              <div className="form-group">
                <label>Monthly income (₹)</label>
                <input type="number" value={profile.monthly_income}
                  onChange={e => setProfile({ ...profile, monthly_income: e.target.value })} placeholder="e.g. 75000" />
              </div>
            </div>

            <div className="grid2">
              <div className="form-group">
                <label>Investment horizon</label>
                <select value={profile.investment_horizon}
                  onChange={e => setProfile({ ...profile, investment_horizon: e.target.value })}>
                  <option>1-2 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>10+ years</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monthly SIP budget (₹)</label>
                <input type="number" value={profile.monthly_sip_budget}
                  onChange={e => setProfile({ ...profile, monthly_sip_budget: e.target.value })} placeholder="e.g. 10000" />
              </div>
            </div>

            <div className="form-group">
              <label>Risk appetite</label>
              <div className="chip-group">
                {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                  <div key={r} className={`chip ${profile.risk_appetite === r ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, risk_appetite: r })}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Financial goals</label>
              <div className="chip-group">
                {ALL_GOALS.map(g => (
                  <div key={g} className={`chip ${profile.goals.includes(g) ? 'active' : ''}`}
                    onClick={() => toggleGoal(g)}>
                    {g}
                  </div>
                ))}
              </div>
            </div>

            <div className="ob-nav">
              <div />
              <button className="btn btn-primary" onClick={goNext}>Next: Portfolio →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Portfolio */}
        {step === 2 && (
          <div className="fade-up">
            <h2 className="ob-title">Current portfolio</h2>
            <p className="ob-sub">Add your existing mutual funds. Leave empty if starting fresh.</p>

            <div className="fund-list">
              {funds.map((f, i) => (
                <div key={i} className="fund-entry">
                  <div className="fund-entry-name">{f.fund_name}</div>
                  <span className="cat-badge cat-eq">{f.category}</span>
                  <div className="fund-entry-amt">₹{parseInt(f.invested_amount).toLocaleString('en-IN')}</div>
                  <button className="btn-del" onClick={() => removeFund(i)}>✕</button>
                </div>
              ))}
              {funds.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No funds added yet.</p>}
            </div>

            <div className="add-fund-row">
              <div className="form-group">
                <label>Fund name</label>
                <input type="text" value={fundForm.fund_name}
                  onChange={e => setFundForm({ ...fundForm, fund_name: e.target.value })} placeholder="Fund name" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={fundForm.category}
                  onChange={e => setFundForm({ ...fundForm, category: e.target.value })}>
                  <option>Equity</option>
                  <option>Debt</option>
                  <option>Hybrid</option>
                  <option>ELSS</option>
                  <option>Index</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" value={fundForm.invested_amount}
                  onChange={e => setFundForm({ ...fundForm, invested_amount: e.target.value })} placeholder="Amount" />
              </div>
              <button className="btn btn-outline" onClick={addFund}>Add</button>
            </div>

            <div className="ob-nav">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={loading}>
                {loading ? 'Saving...' : 'Analyze with AI →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Analyzing */}
        {step === 3 && (
          <div className="fade-up" style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <h2 className="ob-title">AI is analyzing your portfolio...</h2>
            <p className="ob-sub">This will only take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;