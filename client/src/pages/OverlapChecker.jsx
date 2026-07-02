import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

function OverlapChecker() {
  const [overlap, setOverlap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portfolio/overlap')
      .then(res => setOverlap(res.data.overlap))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Overlap Checker"><div className="loading">Analyzing overlap...</div></DashboardLayout>;

  const highOverlap = overlap.filter(o => o.overlapPercent > 35);

  return (
    <DashboardLayout title="Portfolio Overlap Checker" subtitle="Detects duplicate stock holdings across your funds">
      {highOverlap.length > 0 && (
        <div className="alert alert-warning">
          ⚠️ <strong>High overlap detected</strong> — {highOverlap.length} fund pair(s) share over 35% of holdings.
        </div>
      )}

      {overlap.length === 0 ? (
        <div className="card">
          <p className="text-muted" style={{ fontSize: 13 }}>Add at least 2 funds to your portfolio to check overlap.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Fund-to-fund overlap %</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {overlap.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span style={{ width: 220, color: 'var(--muted)', flexShrink: 0 }}>{o.fund1} ↔ {o.fund2}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${o.overlapPercent}%`,
                    background: o.overlapPercent > 35 ? 'var(--red)' : o.overlapPercent > 20 ? '#E67E22' : 'var(--green)',
                    borderRadius: 4
                  }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{o.overlapPercent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default OverlapChecker;