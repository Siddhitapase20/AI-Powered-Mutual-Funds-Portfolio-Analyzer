import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#00B386', '#3B82F6', '#F59E0B', '#7C3AED', '#EF4444'];

export default function Rebalancing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rebalancing/analysis')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Rebalancing"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  if (!data || data.message) return (
    <DashboardLayout title="Rebalancing Alerts" subtitle="Keep your portfolio aligned with your risk profile">
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">⚖</div>
          <div className="empty-state-title">Add funds to get rebalancing analysis</div>
        </div>
      </div>
    </DashboardLayout>
  );

  const currentPieData = Object.entries(data.currentAllocation).map(([name, value]) => ({ name, value }));
  const targetPieData = Object.entries(data.targetAllocation).map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout
      title="Rebalancing Alerts"
      subtitle={`Portfolio vs target allocation · Risk profile: ${data.riskProfile}`}
    >
      {/* Alert banner */}
      {data.needsRebalancing ? (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚖ <strong>Rebalancing needed.</strong> Your portfolio has drifted from your target allocation by more than 5%. Review the suggestions below.
        </div>
      ) : (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✅ <strong>Portfolio is balanced.</strong> Your current allocation is within 5% of your target. No action needed.
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Current allocation</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={currentPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {currentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Target allocation <span className="card-subtitle">Based on your {data.riskProfile} risk profile</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={targetPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {targetPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drift table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Allocation drift analysis</div>
        <table className="fin-table">
          <thead>
            <tr><th>Category</th><th>Current %</th><th>Target %</th><th>Drift</th><th>Action needed</th><th>Amount to shift</th></tr>
          </thead>
          <tbody>
            {Object.entries(data.currentAllocation).map(([cat, curr]) => {
              const target = data.targetAllocation[cat] || 0;
              const drift = parseFloat((curr - target).toFixed(1));
              const absDrift = Math.abs(drift);
              const isOver = drift > 0;
              const severity = absDrift > 10 ? 'high' : absDrift > 5 ? 'medium' : 'low';
              const amountToShift = parseFloat(((absDrift / 100) * data.totalPortfolioValue).toFixed(0));

              return (
                <tr key={cat}>
                  <td style={{ fontWeight: 600 }}>{cat}</td>
                  <td>{curr}%</td>
                  <td>{target}%</td>
                  <td>
                    <span style={{ color: isOver ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                      {isOver ? '+' : ''}{drift}%
                    </span>
                  </td>
                  <td>
                    {absDrift > 5 ? (
                      <span style={{ background: severity === 'high' ? 'var(--red-bg)' : 'var(--gold-bg)', color: severity === 'high' ? 'var(--red)' : '#92400E', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {isOver ? '↓ Reduce' : '↑ Increase'}
                      </span>
                    ) : (
                      <span style={{ background: 'var(--green-bg)', color: 'var(--green-dark)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ OK</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {amountToShift > 0 ? `₹${amountToShift.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action suggestions */}
      {data.suggestions.length > 0 && (
        <div className="card">
          <div className="card-title">Recommended actions</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {data.suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {s.includes('Reduce') ? '↓' : '↑'}
                </span>
                <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--blue-bg)', borderRadius: 8, fontSize: 12, color: '#1E40AF' }}>
            ℹ️ Rebalancing tip: Instead of selling existing funds (which triggers tax), consider directing new SIP investments toward under-allocated categories first.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}