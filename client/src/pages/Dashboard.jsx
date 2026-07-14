import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const GROWTH_DATA = [
  { m: 'Jan', p: 100000, b: 100000 }, { m: 'Feb', p: 104200, b: 102000 },
  { m: 'Mar', p: 101800, b: 99500 },  { m: 'Apr', p: 108400, b: 104200 },
  { m: 'May', p: 112600, b: 106800 }, { m: 'Jun', p: 110200, b: 105400 },
  { m: 'Jul', p: 116800, b: 108600 }, { m: 'Aug', p: 119400, b: 110200 },
  { m: 'Sep', p: 117200, b: 109800 }, { m: 'Oct', p: 122600, b: 113200 },
  { m: 'Nov', p: 120400, b: 111800 }, { m: 'Dec', p: 126800, b: 115400 },
];

const COLORS = ['#00B386', '#3B82F6', '#F59E0B', '#7C3AED', '#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: ₹{p.value.toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  useEffect(() => {
    Promise.all([
      api.get('/portfolio/summary').then(r => setSummary(r.data)),
      api.get('/ai/insights').then(r => setInsights(r.data.insights || [])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="">
      <div className="loading"><div className="spinner" /><span>Loading your portfolio...</span></div>
    </DashboardLayout>
  );

  const funds = summary?.funds || [];
  const alloc = summary?.allocation || {};
  const allocData = Object.entries(alloc).map(([name, value]) => ({ name, value }));
  const score = summary?.healthScore || 0;
  const scoreColor = score >= 75 ? '#00B386' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <DashboardLayout
      title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
      subtitle="Here's your portfolio at a glance"
      action={
        <button className="btn btn-primary" onClick={() => navigate('/portfolio')}>
          + Add Fund
        </button>
      }
    >
      {/* Metric cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric-card green">
          <div className="metric-icon green">💰</div>
          <div className="metric-label">Total Invested</div>
          <div className="metric-value">₹{(summary?.totalInvested || 0).toLocaleString('en-IN')}</div>
          <div className="metric-badge neutral">{summary?.fundCount || 0} funds</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue">📈</div>
          <div className="metric-label">Current Value</div>
          <div className="metric-value">₹{(summary?.currentValue || 0).toLocaleString('en-IN')}</div>
          <div className={`metric-badge ${(summary?.totalReturn || 0) >= 0 ? 'up' : 'dn'}`}>
            {(summary?.totalReturn || 0) >= 0 ? '↑' : '↓'} {Math.abs(summary?.totalReturn || 0).toFixed(1)}% returns
          </div>
        </div>
        <div className="metric-card gold">
          <div className="metric-icon gold">⚡</div>
          <div className="metric-label">XIRR</div>
          <div className="metric-value">{summary?.xirr || 0}%</div>
          <div className="metric-badge up">↑ Above avg</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">🎯</div>
          <div className="metric-label">Health Score</div>
          <div className="metric-value" style={{ color: scoreColor }}>{score}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>/100</span></div>
          <div className={`metric-badge ${score >= 70 ? 'up' : score >= 50 ? 'neutral' : 'dn'}`}>
            {score >= 70 ? 'Good' : score >= 50 ? 'Average' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Chart + Allocation */}
{/* Chart + Allocation */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 20 }}>
  <div className="card">
    <div className="card-title">
      Portfolio growth
      <span className="card-subtitle">vs Nifty 50 benchmark</span>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={GROWTH_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="p" stroke="#00B386" strokeWidth={2.5} dot={false} name="Portfolio" />
        <Line type="monotone" dataKey="b" stroke="#E8EAED" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Nifty 50" />
      </LineChart>
    </ResponsiveContainer>
    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span style={{ width: 14, height: 2, background: '#00B386', display: 'inline-block', borderRadius: 1 }} />Portfolio
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
        <span style={{ width: 14, height: 2, background: '#E8EAED', display: 'inline-block', borderRadius: 1 }} />Nifty 50
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-title">Asset allocation</div>
    {allocData.length > 0 ? (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <PieChart width={140} height={140}>
            <Pie data={allocData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
              {allocData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          {allocData.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#6B7280' }}>{item.name}</span>
              </div>
              <span style={{ fontWeight: 700 }}>
                {((item.value / (summary?.totalInvested || 1)) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🥧</div>
        Add funds to see allocation
      </div>
    )}
  </div>
</div>

      {/* Holdings mini table */}
      {funds.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">
            Your holdings
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/portfolio')}>View all</button>
          </div>
          <table className="fin-table">
            <thead><tr><th>Fund</th><th>Category</th><th>Invested</th><th>Current</th><th>Return</th></tr></thead>
            <tbody>
              {funds.slice(0, 4).map(f => {
                const ret = ((parseFloat(f.current_value || f.invested_amount) - parseFloat(f.invested_amount)) / parseFloat(f.invested_amount)) * 100;
                return (
                  <tr key={f.id}>
                    <td><strong style={{ fontSize: 13 }}>{f.fund_name}</strong></td>
                    <td><span className={`badge badge-${f.category.toLowerCase()}`}>{f.category}</span></td>
                    <td style={{ fontWeight: 500 }}>₹{parseFloat(f.invested_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(f.current_value || f.invested_amount).toLocaleString('en-IN')}</td>
                    <td className={ret >= 0 ? 'pos' : 'neg'}>{ret >= 0 ? '+' : ''}{ret.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* AI insights */}
      <div className="card">
        <div className="card-title">
          AI insights ✦
          <span className="card-subtitle">Powered by Claude</span>
        </div>
        {insights.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">🤖</div>
            <div className="empty-state-sub">Add funds to get personalized AI insights</div>
          </div>
        ) : (
          <div className="grid-3">
            {insights.map((ins, i) => (
              <div key={i} className="insight-card">
                <div className="insight-icon" style={{ background: i === 0 ? 'var(--red-bg)' : i === 1 ? 'var(--blue-bg)' : 'var(--gold-bg)' }}>
                  {ins.icon}
                </div>
                <div className="insight-body">
                  <strong>{ins.title}</strong>
                  <p>{ins.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}