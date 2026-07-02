import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

function FundComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/funds/performance')
      .then(res => setData(res.data.performance))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Fund Comparison"><div className="loading">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Fund Comparison" subtitle="Side-by-side analysis of your funds">
      {data.length === 0 ? (
        <div className="card"><p className="text-muted" style={{ fontSize: 13 }}>Add at least 2 funds to compare.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.length, 3)}, 1fr)`, gap: '1rem' }}>
          {data.slice(0, 3).map((f, i) => (
            <div key={i} className="card">
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '.75rem', marginBottom: '.75rem' }}>
                <h4 style={{ fontSize: 14 }}>{f.name}</h4>
                <span className={`cat-badge cat-${f.category.toLowerCase()}`}>{f.category}</span>
              </div>
              {[
                ['1Y Return', `${f.returns['1Y']}%`],
                ['3Y CAGR', `${f.returns['3Y']}%`],
                ['5Y CAGR', `${f.returns['5Y']}%`],
                ['Expense Ratio', `${f.expenseRatio}%`],
                ['Sharpe Ratio', f.sharpeRatio],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cream)', fontSize: 13 }}>
                  <span className="text-muted" style={{ fontSize: 12 }}>{lbl}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default FundComparison;