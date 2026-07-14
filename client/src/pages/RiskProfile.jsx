import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

const QUESTIONS = [
  { q: 'What is your primary financial goal?', opts: ['Capital preservation — safety first', 'Steady income — predictable returns', 'Balanced growth — some risk ok', 'Maximum growth — high risk, high reward'] },
  { q: 'If your portfolio fell 30% in a crash, you would:', opts: ['Sell everything immediately', 'Sell some and wait', 'Hold on and wait for recovery', 'Buy more — great opportunity!'] },
  { q: 'How stable is your monthly income?', opts: ['Very unstable — freelance/irregular', 'Somewhat stable — may change soon', 'Stable — permanent salaried job', 'Very stable — govt/multiple sources'] },
  { q: 'What is your investment time horizon?', opts: ['Less than 1 year', '1–3 years', '3–7 years', 'More than 7 years'] },
  { q: 'How many months of expenses do you have saved?', opts: ['None', '1–2 months', '3–6 months', 'More than 6 months'] },
];

export default function RiskProfile() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      alert('Please answer all 5 questions.');
      return;
    }
    setLoading(true);
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    try {
      const res = await api.post('/ai/risk-analysis', { answers, totalScore });
      setResult(res.data);
    } catch { alert('Failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const riskColor = result?.riskLevel === 'Conservative' ? '#3B82F6' : result?.riskLevel === 'Moderate' ? '#F59E0B' : '#EF4444';

  return (
    <DashboardLayout title="Risk Profile" subtitle="Find your ideal investment risk level">
      {!result ? (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: 'var(--blue-bg)', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1E40AF' }}>
            ℹ️ Your answers help us recommend the right fund allocation for your financial situation.
          </div>
          {QUESTIONS.map((item, qi) => (
            <div key={qi} className="quiz-card">
              <div className="quiz-question">{qi + 1}. {item.q}</div>
              {item.opts.map((opt, oi) => (
                <div key={oi} className={`quiz-option ${answers[qi] === oi + 1 ? 'selected' : ''}`}
                  onClick={() => setAnswers({ ...answers, [qi]: oi + 1 })}>
                  <span style={{ marginRight: 10, opacity: .5 }}>{['A', 'B', 'C', 'D'][oi]}.</span>{opt}
                </div>
              ))}
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 8 }} onClick={submit} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate my risk profile →'}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <div className="risk-result">
            <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 16, background: riskColor + '20', color: riskColor }}>
              ⚖ {result.riskLevel} Risk Investor
            </div>

            <div className="risk-score-ring">
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="#F1F3F5" strokeWidth="10" />
                <circle cx="70" cy="70" r="58" fill="none" stroke={riskColor} strokeWidth="10"
                  strokeDasharray="364"
                  strokeDashoffset={364 - (364 * result.totalScore / 20)}
                  strokeLinecap="round" />
              </svg>
              <div className="risk-score-number">
                <strong style={{ color: riskColor }}>{result.totalScore}</strong>
                <small>out of 20</small>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 420, margin: '0 auto 8px' }}>
              {result.riskLevel === 'Conservative' && 'You prefer safety over growth. Focus on debt and liquid funds.'}
              {result.riskLevel === 'Moderate' && 'You balance growth with stability. Ideal for equity + debt mix.'}
              {result.riskLevel === 'Aggressive' && 'You seek maximum growth and can handle market volatility.'}
            </div>

            <div className="risk-alloc-grid">
              <div className="risk-alloc-item" style={{ background: 'var(--green-bg)' }}>
                <div className="risk-alloc-pct" style={{ color: 'var(--green)' }}>{result.allocation.equity}%</div>
                <div className="risk-alloc-lbl">Equity funds</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Large cap, Flexi cap</div>
              </div>
              <div className="risk-alloc-item" style={{ background: 'var(--blue-bg)' }}>
                <div className="risk-alloc-pct" style={{ color: 'var(--blue)' }}>{result.allocation.debt}%</div>
                <div className="risk-alloc-lbl">Debt funds</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Short / mid duration</div>
              </div>
              <div className="risk-alloc-item" style={{ background: 'var(--purple-bg)' }}>
                <div className="risk-alloc-pct" style={{ color: 'var(--purple)' }}>{result.allocation.hybrid}%</div>
                <div className="risk-alloc-lbl">Hybrid / ELSS</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Balanced, Tax saving</div>
              </div>
            </div>
          </div>

          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => { setResult(null); setAnswers({}); }}>
            ← Retake quiz
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}