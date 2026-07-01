import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

const QUESTIONS = [
  {
    q: 'What is your primary financial goal?',
    options: ['Capital preservation', 'Steady income', 'Balanced growth', 'Maximum growth']
  },
  {
    q: 'If your portfolio dropped 30% in a crash, you would:',
    options: ['Sell everything immediately', 'Sell some and wait', 'Hold and wait for recovery', 'Buy more']
  },
  {
    q: 'How stable is your monthly income?',
    options: ['Very unstable', 'Somewhat stable', 'Stable, salaried', 'Very stable']
  },
  {
    q: 'What is your investment time horizon?',
    options: ['Less than 1 year', '1-3 years', '3-7 years', 'More than 7 years']
  },
  {
    q: 'Emergency savings as % of expenses?',
    options: ['None', '1-2 months', '3-6 months', 'More than 6 months']
  }
];

function RiskProfile() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectAnswer = (qIndex, optIndex) => {
    setAnswers({ ...answers, [qIndex]: optIndex + 1 });
  };

  const submitQuiz = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      alert('Please answer all questions.');
      return;
    }

    setLoading(true);
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);

    try {
      const res = await api.post('/ai/risk-analysis', { answers, totalScore });
      setResult(res.data);
    } catch (err) {
      alert('Failed to calculate risk profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Risk Profile Assessment" subtitle="Answer 5 questions to find your investor risk level">
      {!result ? (
        <>
          {QUESTIONS.map((item, qi) => (
            <div key={qi} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>{qi + 1}. {item.q}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {item.options.map((opt, oi) => (
                  <div
                    key={oi}
                    onClick={() => selectAnswer(qi, oi)}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: answers[qi] === oi + 1 ? 'var(--ink)' : '#fff',
                      color: answers[qi] === oi + 1 ? '#F7F4EE' : 'var(--ink)',
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-primary" onClick={submitQuiz} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate my risk profile →'}
          </button>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600, marginBottom: '1rem', background: '#F0DFA0', color: '#6B4C00' }}>
            ⚖ {result.riskLevel} Risk Investor
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '.5rem' }}>
            Score: {result.totalScore} / 20
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--green)' }}>{result.allocation.equity}%</div>
              <div style={{ fontSize: 13 }}>Equity</div>
            </div>
            <div style={{ background: 'var(--blue-light)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--blue)' }}>{result.allocation.debt}%</div>
              <div style={{ fontSize: 13 }}>Debt</div>
            </div>
            <div style={{ background: '#F3E8FF', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#6B21A8' }}>{result.allocation.hybrid}%</div>
              <div style={{ fontSize: 13 }}>Hybrid</div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => { setResult(null); setAnswers({}); }}>
            Retake quiz
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

export default RiskProfile;