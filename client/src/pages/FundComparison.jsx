import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function FundComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/funds/performance')
      .then(r => setData(r.data.performance))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Fund Comparison"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  const getBest = (key) => {
    if (data.length === 0) return null;
    return data.reduce((best, f) => parseFloat(f[key]) > parseFloat(best[key]) ? f : best);
  };

  const metrics = [
    { key: 'returns.1Y', label: '1Y Return', format: v => `${v}%`, higherBetter: true },
    { key: 'returns.3Y', label: '3Y CAGR', format: v => `${v}%`, higherBetter: true },
    { key: 'returns.5Y', label: '5Y CAGR', format: v => `${v}%`, higherBetter: true },
    { key: 'expenseRatio', label: 'Expense Ratio', format: v => `${v}%`, higherBetter: false },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', format: v => v, higherBetter: true },
  ];

  const getVal = (fund, key) => {
    const keys = key.split('.');
    return keys.reduce((obj, k) => obj?.[k], fund);
  };

  const bestVals = {};
  metrics.forEach(m => {
    const vals = data.map(f => parseFloat(getVal(f, m.key)));
    bestVals[m.key] = m.higherBetter ? Math.max(...vals) : Math.min(...vals);
  });

  return (
    <DashboardLayout title="Fund Comparison" subtitle="Side-by-side analysis of your holdings">
      {data.length < 2 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-title">Need at least 2 funds</div>
            <div className="empty-state-sub">Add more funds to your portfolio to compare them</div>
          </div>
        </div>
      ) : (
        <>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            ℹ️ Green values indicate the best performer in each metric across your funds.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.length, 3)}, 1fr)`, gap: 14 }}>
            {data.slice(0, 3).map((f, i) => {
              const is1Y = parseFloat(f.returns['1Y']) === bestVals['returns.1Y'];
              return (
                <div key={i} className={`compare-col ${is1Y ? 'featured' : ''}`}>
                  {is1Y && <div style={{ background: 'var(--green)', padding: '6px 16px', textAlign: 'center' }}><span className="compare-featured-tag" style={{ color: '#fff' }}>★ TOP PERFORMER</span></div>}
                  <div className="compare-head">
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                    <span className={`badge badge-${f.category.toLowerCase()}`}>{f.category}</span>
                  </div>
                  {metrics.map(m => {
                    const val = getVal(f, m.key);
                    const numVal = parseFloat(val);
                    const isBest = numVal === bestVals[m.key];
                    return (
                      <div key={m.key} className="compare-row">
                        <span className="compare-key">{m.label}</span>
                        <span className={`compare-val ${isBest ? 'best' : ''}`}>{m.format(val)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}