import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

function Performance() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('1Y');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/funds/performance')
      .then(res => setData(res.data.performance))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Fund Performance"><div className="loading">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Fund Performance" subtitle="Historical returns across periods">
      <div className="chip-group" style={{ marginBottom: '1.5rem' }}>
        {['1Y', '3Y', '5Y'].map(p => (
          <div key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p === '1Y' ? '1 Year' : p === '3Y' ? '3 Years' : '5 Years'}</div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="card"><p className="text-muted" style={{ fontSize: 13 }}>Add funds to your portfolio to see performance data.</p></div>
      ) : (
        <div className="card">
          <div className="card-title">Returns comparison <span>{period} CAGR</span></div>
          {data.map((f, i) => {
            const ret = parseFloat(f.returns[period]);
            return (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{f.name}</span>
                  <span className={ret >= 0 ? 'pos' : 'neg'}>{ret}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(ret * 4, 100)}%`, background: ret >= 0 ? '#1A6B3C' : '#C0392B', borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Performance;