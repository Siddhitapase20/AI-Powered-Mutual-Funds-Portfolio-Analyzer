import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ALL_GOALS = [
  { label: 'Wealth creation', icon: '📈' },
  { label: 'Retirement', icon: '🏖' },
  { label: 'Tax saving (ELSS)', icon: '💰' },
  { label: 'Child education', icon: '🎓' },
  { label: 'Home purchase', icon: '🏠' },
];

export default function Onboarding() {
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
  const [fundForm, setFundForm] = useState({
    fund_name: '',
    category: 'Equity',
    invested_amount: '',
  });

  const toggleGoal = (goal) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const addFund = () => {
    if (!fundForm.fund_name || !fundForm.invested_amount) return;
    setFunds([...funds, { ...fundForm }]);
    setFundForm({ fund_name: '', category: 'Equity', invested_amount: '' });
  };

  const goNext = async () => {
    if (step === 1) {
      if (!profile.age || !profile.monthly_income) {
        setError('Please fill in your age and monthly income.');
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
      await api.put('/auth/profile', profile);
      for (const fund of funds) {
        await api.post('/portfolio', fund);
      }
      api.post('/funds/sync-nav').catch(() => {});
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const RISK_OPTIONS = [
    { label: 'Conservative', desc: 'Safety first', color: '#3B82F6', icon: '🛡' },
    { label: 'Moderate', desc: 'Balanced growth', color: '#F59E0B', icon: '⚖' },
    { label: 'Aggressive', desc: 'Maximum growth', color: '#EF4444', icon: '🚀' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF9 0%, #F8F9FA 60%, #EFF6FF 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, DM Sans, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 28, letterSpacing: -0.5 }}>
          Fund<span style={{ color: '#00B386' }}>Sense</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s < step ? '#00B386' : s === step ? '#F59E0B' : '#E8EAED',
              transition: 'background .3s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp .35s ease' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Your investor profile</h2>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Tell us about yourself so we can personalize your recommendations</p>
            </div>

            {/* Age + Income */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={e => setProfile({ ...profile, age: e.target.value })}
                  placeholder="e.g. 28"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border .15s' }}
                  onFocus={e => e.target.style.borderColor = '#00B386'}
                  onBlur={e => e.target.style.borderColor = '#E8EAED'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Monthly income (₹)</label>
                <input
                  type="number"
                  value={profile.monthly_income}
                  onChange={e => setProfile({ ...profile, monthly_income: e.target.value })}
                  placeholder="e.g. 75000"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#00B386'}
                  onBlur={e => e.target.style.borderColor = '#E8EAED'}
                />
              </div>
            </div>

            {/* Horizon + SIP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Investment horizon</label>
                <select
                  value={profile.investment_horizon}
                  onChange={e => setProfile({ ...profile, investment_horizon: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                >
                  <option>1-2 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>10+ years</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Monthly SIP budget (₹)</label>
                <input
                  type="number"
                  value={profile.monthly_sip_budget}
                  onChange={e => setProfile({ ...profile, monthly_sip_budget: e.target.value })}
                  placeholder="e.g. 10000"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#00B386'}
                  onBlur={e => e.target.style.borderColor = '#E8EAED'}
                />
              </div>
            </div>

            {/* Risk appetite */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Risk appetite</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {RISK_OPTIONS.map(r => (
                  <div
                    key={r.label}
                    onClick={() => setProfile({ ...profile, risk_appetite: r.label })}
                    style={{
                      padding: '14px 12px',
                      border: `2px solid ${profile.risk_appetite === r.label ? r.color : '#E8EAED'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: profile.risk_appetite === r.label ? r.color + '10' : '#fff',
                      textAlign: 'center',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: profile.risk_appetite === r.label ? r.color : '#374151' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Financial goals <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(select all that apply)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_GOALS.map(g => (
                  <div
                    key={g.label}
                    onClick={() => toggleGoal(g.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px',
                      border: `1.5px solid ${profile.goals.includes(g.label) ? '#00B386' : '#E8EAED'}`,
                      borderRadius: 20,
                      cursor: 'pointer',
                      background: profile.goals.includes(g.label) ? '#E6F7F3' : '#fff',
                      fontSize: 13,
                      fontWeight: profile.goals.includes(g.label) ? 600 : 400,
                      color: profile.goals.includes(g.label) ? '#00816A' : '#374151',
                      transition: 'all .15s',
                    }}
                  >
                    <span>{g.icon}</span>{g.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={goNext}
                style={{ background: '#00B386', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Next: Add portfolio →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Current portfolio</h2>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Add existing funds or skip if you're starting fresh</p>
            </div>

            {/* Fund list */}
            <div style={{ marginBottom: 16 }}>
              {funds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#F8F9FA', borderRadius: 10, border: '1px dashed #E8EAED', color: '#9CA3AF', fontSize: 13 }}>
                  No funds added yet. Add your existing mutual funds below.
                </div>
              ) : (
                funds.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', border: '1px solid #E8EAED', borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, background: '#E6F7F3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📊</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.fund_name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{f.category}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>₹{parseInt(f.invested_amount).toLocaleString('en-IN')}</div>
                    <button
                      onClick={() => setFunds(funds.filter((_, idx) => idx !== i))}
                      style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
                    >✕</button>
                  </div>
                ))
              )}
            </div>

            {/* Add fund form */}
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#374151' }}>+ Add a fund</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 5 }}>Fund name</label>
                  <input
                    type="text"
                    value={fundForm.fund_name}
                    onChange={e => setFundForm({ ...fundForm, fund_name: e.target.value })}
                    placeholder="e.g. Mirae Asset Large Cap"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#00B386'}
                    onBlur={e => e.target.style.borderColor = '#E8EAED'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 5 }}>Category</label>
                  <select
                    value={fundForm.category}
                    onChange={e => setFundForm({ ...fundForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                  >
                    <option>Equity</option>
                    <option>Debt</option>
                    <option>Hybrid</option>
                    <option>ELSS</option>
                    <option>Index</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 5 }}>Invested amount (₹)</label>
                  <input
                    type="number"
                    value={fundForm.invested_amount}
                    onChange={e => setFundForm({ ...fundForm, invested_amount: e.target.value })}
                    placeholder="e.g. 50000"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E8EAED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#00B386'}
                    onBlur={e => e.target.style.borderColor = '#E8EAED'}
                  />
                </div>
                <button
                  onClick={addFund}
                  style={{ background: '#00B386', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  Add fund
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'transparent', border: '1.5px solid #E8EAED', color: '#374151', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
              <button
                onClick={goNext}
                disabled={loading}
                style={{ background: '#00B386', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? .7 : 1 }}
              >
                {loading ? 'Saving...' : funds.length > 0 ? 'Analyze with AI →' : 'Skip & go to dashboard →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 56, height: 56, border: '4px solid #E8EAED', borderTopColor: '#00B386', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI is analyzing your portfolio...</h2>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Setting up your personalized dashboard. Just a moment.</p>
            <div style={{ display: 'grid', gap: 10, maxWidth: 360, margin: '28px auto 0', textAlign: 'left' }}>
              {['Saving your investor profile', 'Adding funds to portfolio', 'Fetching live NAV from AMFI', 'Running AI analysis', 'Preparing dashboard'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B7280' }}>
                  <span style={{ color: '#00B386', fontSize: 14 }}>✓</span>{step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}