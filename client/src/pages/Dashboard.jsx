import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { month: 'Jan', value: 100000, benchmark: 100000 },
  { month: 'Feb', value: 104000, benchmark: 102000 },
  { month: 'Mar', value: 101000, benchmark: 99000 },
  { month: 'Apr', value: 108000, benchmark: 104000 },
  { month: 'May', value: 112000, benchmark: 106000 },
  { month: 'Jun', value: 110000, benchmark: 105000 },
  { month: 'Jul', value: 115000, benchmark: 108000 },
  { month: 'Aug', value: 118000, benchmark: 110000 },
  { month: 'Sep', value: 116000, benchmark: 109000 },
  { month: 'Oct', value: 121000, benchmark: 112000 },
  { month: 'Nov', value: 119000, benchmark: 111000 },
  { month: 'Dec', value: 125000, benchmark: 114000 },
];

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
  try {
    // Temporary mock data until backend is ready
    setSummary({
      totalInvested: 100000,
      currentValue: 118000,
      totalReturn: 18.0,
      xirr: 16.2,
      fundCount: 3,
      healthScore: 79,
    });
    setInsights([
      {
        icon: '⚠️',
        title: 'Overlap Alert',
        text: 'Mirae Asset and Axis Bluechip share 42% holdings. Consider replacing Axis with Parag Parikh Flexi Cap.',
      },
      {
        icon: '📈',
        title: 'Missing Mid-Cap',
        text: 'Your portfolio is 100% large-cap. Adding a mid-cap index fund can boost long-term returns.',
      },
      {
        icon: '💰',
        title: 'Tax Saving',
        text: 'Invest ₹1.5L in ELSS before March 31 to save ₹46,800 in tax under Section 80C.',
      },
    ]);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
  } finally {
    setLoading(false);
  }
};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <DashboardLayout title="Dashboard">
      <div className="loading">Loading your portfolio...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title={`${getGreeting()}, ${user?.name?.split(' ')[0]} `}
      subtitle="Here is your portfolio overview"
    >
      {/* Metrics */}
      <div className="grid4" style={{ marginBottom: '1.5rem' }}>
        <div className="metric">
          <div className="metric-lbl">Total invested</div>
          <div className="metric-val">₹{summary?.totalInvested?.toLocaleString('en-IN') || '—'}</div>
          <div className="metric-change">{summary?.fundCount || 0} funds</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Current value</div>
          <div className="metric-val">₹{summary?.currentValue?.toLocaleString('en-IN') || '—'}</div>
          <div className={`metric-change ${summary?.totalReturn >= 0 ? 'up' : 'dn'}`}>
            {summary?.totalReturn >= 0 ? '↑' : '↓'} {Math.abs(summary?.totalReturn || 0).toFixed(1)}% total
          </div>
        </div>
        <div className="metric">
          <div className="metric-lbl">XIRR</div>
          <div className="metric-val">{summary?.xirr || '—'}%</div>
          <div className="metric-change up">↑ Above avg</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Health score</div>
          <div className="metric-val" style={{ color: 'var(--green)' }}>{summary?.healthScore || '—'}<small style={{ fontSize: '1rem' }}>/100</small></div>
          <div className="metric-change up">Good</div>
        </div>
      </div>

      {/* Chart + Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">Portfolio growth <span>Last 12 months</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="value" stroke="#1A6B3C" strokeWidth={2} dot={false} name="Portfolio" />
              <Line type="monotone" dataKey="benchmark" stroke="#C9A84C" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Nifty 50" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><span style={{ display: 'inline-block', width: 16, height: 2, background: '#1A6B3C', borderRadius: 1 }} />Portfolio</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}><span style={{ display: 'inline-block', width: 16, height: 2, background: '#C9A84C', borderRadius: 1 }} />Nifty 50</div>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">Portfolio health score</div>
          <div style={{ padding: '1rem 0' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#EDE9E0" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1A6B3C" strokeWidth="8"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * (summary?.healthScore || 79)) / 100}
                strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--green)', marginTop: '-90px', position: 'relative' }}>
              {summary?.healthScore || 79}
            </div>
            <div style={{ marginTop: '60px', fontSize: 13, fontWeight: 500, color: 'var(--green)' }}>Good</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginTop: '.5rem' }}>
            <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--green)' }}>High</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Diversification</div>
            </div>
            <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--red)' }}>42%</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Overlap</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="card-title">AI-generated insights ✦</div>
        {insights.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>No insights yet. Add funds to your portfolio to get AI recommendations.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{ background: 'var(--cream)', borderRadius: 10, padding: '1rem', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{insight.icon}</span>
                <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                  <strong style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>{insight.title}</strong>
                  {insight.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;