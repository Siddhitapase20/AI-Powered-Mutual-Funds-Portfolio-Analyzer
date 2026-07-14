import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function OverlapChecker() {
  const [overlap, setOverlap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portfolio/overlap')
      .then(r => setOverlap(r.data.overlap))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Overlap Checker"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  const highOverlap = overlap.filter(o => o.overlapPercent > 35);
  const medOverlap = overlap.filter(o => o.overlapPercent > 20 && o.overlapPercent <= 35);

  const getColor = (pct) => pct > 35 ? '#EF4444' : pct > 20 ? '#F59E0B' : '#00B386';
  const getBg = (pct) => pct > 35 ? 'var(--red-bg)' : pct > 20 ? 'var(--gold-bg)' : 'var(--green-bg)';
  const getLabel = (pct) => pct > 35 ? 'High' : pct > 20 ? 'Medium' : 'Low';

  return (
    <DashboardLayout title="Overlap Checker" subtitle="Detect duplicate stock holdings across your funds">
      {highOverlap.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠️ <strong>High overlap detected in {highOverlap.length} fund pair(s).</strong> You may be doubling up on the same stocks without knowing it.
        </div>
      )}

      {overlap.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Add at least 2 funds</div>
            <div className="empty-state-sub">We need at least 2 funds in your portfolio to check for overlap</div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 18px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{highOverlap.length}</div>
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 2 }}>High overlap (35%+)</div>
            </div>
            <div style={{ background: 'var(--gold-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#92400E' }}>{medOverlap.length}</div>
              <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>Medium overlap (20–35%)</div>
            </div>
            <div style={{ background: 'var(--green-bg)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 18px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{overlap.length - highOverlap.length - medOverlap.length}</div>
              <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>Low overlap (under 20%)</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Fund pair analysis</div>
            {overlap.map((o, i) => (
              <div key={i} className="overlap-item">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.fund1}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0' }}>↔</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.fund2}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${o.overlapPercent}%`, background: getColor(o.overlapPercent) }} />
                    </div>
                    <span style={{ fontWeight: 700, color: getColor(o.overlapPercent), fontSize: 14, width: 40 }}>{o.overlapPercent}%</span>
                    <span style={{ background: getBg(o.overlapPercent), color: getColor(o.overlapPercent), padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, width: 60, textAlign: 'center' }}>
                      {getLabel(o.overlapPercent)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 16 }}>
              <span><span style={{ color: 'var(--green)', fontWeight: 700 }}>●</span> Under 20% = Healthy</span>
              <span><span style={{ color: '#F59E0B', fontWeight: 700 }}>●</span> 20–35% = Caution</span>
              <span><span style={{ color: 'var(--red)', fontWeight: 700 }}>●</span> 35%+ = High overlap</span>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}