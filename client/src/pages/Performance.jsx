import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';

export default function Performance() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('1Y');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/funds/performance')
      .then(r => setData(r.data.performance))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Fund Performance"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  const chartData = data.map(f => ({
    name: f.name.split(' ').slice(0, 2).join(' '),
    return: parseFloat(f.returns[period]),
    full: f.name,
  }));

  return (
    <DashboardLayout title="Fund Performance" subtitle="Historical returns across time periods">
      <div className="chip-row" style={{ marginBottom: 20 }}>
        {['1Y', '3Y', '5Y'].map(p => (
          <div key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === '1Y' ? '1 Year' : p === '3Y' ? '3 Years' : '5 Years'}
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <div className="empty-state-title">No fund data yet</div>
            <div className="empty-state-sub">Add funds to your portfolio to see performance</div>
          </div>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Returns comparison <span className="card-subtitle">{period} CAGR</span></div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Return']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="return" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.return >= 0 ? '#00B386' : '#EF4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed table */}
          <div className="card">
            <div className="card-title">Detailed metrics</div>
            <table className="fin-table">
              <thead>
                <tr><th>Fund</th><th>Category</th><th>1Y</th><th>3Y</th><th>5Y</th><th>Exp Ratio</th><th>Sharpe</th></tr>
              </thead>
              <tbody>
                {data.map((f, i) => (
                  <tr key={i}>
                    <td><strong style={{ fontSize: 13 }}>{f.name}</strong></td>
                    <td><span className={`badge badge-${f.category.toLowerCase()}`}>{f.category}</span></td>
                    <td className={parseFloat(f.returns['1Y']) >= 0 ? 'pos' : 'neg'}>{f.returns['1Y']}%</td>
                    <td className={parseFloat(f.returns['3Y']) >= 0 ? 'pos' : 'neg'}>{f.returns['3Y']}%</td>
                    <td className={parseFloat(f.returns['5Y']) >= 0 ? 'pos' : 'neg'}>{f.returns['5Y']}%</td>
                    <td>{f.expenseRatio}%</td>
                    <td>{f.sharpeRatio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}