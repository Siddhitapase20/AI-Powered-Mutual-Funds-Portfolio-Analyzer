import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SIPCalculator() {
  const [corpus, setCorpus] = useState(5000000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => { calculate(); }, [corpus, years, rate]);

  const calculate = () => {
    const mr = rate / 100 / 12;
    const n = years * 12;
    const needed = Math.round((corpus * mr) / ((Math.pow(1 + mr, n) - 1) * (1 + mr)));
    const totalInvested = needed * n;
    const wealthGain = corpus - totalInvested;

    setResult({ needed, totalInvested, wealthGain, corpus });

    const data = [];
    for (let y = 1; y <= years; y++) {
      const months = y * 12;
      const fv = needed * (Math.pow(1 + mr, months) - 1) / mr * (1 + mr);
      data.push({ year: `${y}Y`, corpus: Math.round(fv), invested: needed * months });
    }
    setChartData(data);
  };

  const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <DashboardLayout title="SIP Calculator" subtitle="Plan your investment goals">
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Controls */}
        <div className="card">
          <div className="card-title">Set your goal</div>
          <div className="slider-wrap">
            <div className="slider-label">Target corpus <span>{fmt(corpus)}</span></div>
            <input type="range" min="500000" max="10000000" step="100000" value={corpus} onChange={e => setCorpus(+e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              <span>₹5L</span><span>₹1Cr</span>
            </div>
          </div>
          <div className="slider-wrap">
            <div className="slider-label">Time horizon <span>{years} years</span></div>
            <input type="range" min="1" max="30" value={years} onChange={e => setYears(+e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              <span>1 year</span><span>30 years</span>
            </div>
          </div>
          <div className="slider-wrap">
            <div className="slider-label">Expected return <span>{rate}% p.a.</span></div>
            <input type="range" min="6" max="20" step="0.5" value={rate} onChange={e => setRate(+e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              <span>6%</span><span>20%</span>
            </div>
          </div>

          <div style={{ marginTop: 8, padding: 14, background: 'var(--green-bg)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--green-dark)', marginBottom: 4, fontWeight: 600 }}>PRO TIP</div>
            <div style={{ fontSize: 12, color: 'var(--green-dark)' }}>Step up your SIP by 10% every year. You'll reach your goal 2-3 years earlier.</div>
          </div>
        </div>

        {/* Result */}
        <div className="sip-result-card">
          <div className="sip-result-label">Required monthly SIP</div>
          <div className="sip-result-value">₹{(result.needed || 0).toLocaleString('en-IN')}</div>
          <div className="sip-result-sub">to reach {fmt(corpus)} in {years} years at {rate}% p.a.</div>

          <div className="grid-2" style={{ marginTop: 24, gap: 12 }}>
            <div className="sip-stat">
              <div className="sip-stat-val" style={{ color: '#9CA3AF' }}>₹{Math.round((result.totalInvested || 0) / 1000)}K</div>
              <div className="sip-stat-lbl">Total invested</div>
            </div>
            <div className="sip-stat">
              <div className="sip-stat-val" style={{ color: '#00B386' }}>₹{Math.round((result.wealthGain || 0) / 1000)}K</div>
              <div className="sip-stat-lbl">Wealth gain</div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
              <span>Invested ({((result.totalInvested / result.corpus) * 100 || 0).toFixed(0)}%)</span>
              <span>Returns ({((result.wealthGain / result.corpus) * 100 || 0).toFixed(0)}%)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(result.totalInvested / result.corpus) * 100 || 0}%`, background: '#374151' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Growth chart */}
      <div className="card">
        <div className="card-title">Corpus growth over time</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B386" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00B386" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v => `₹${Math.round(v).toLocaleString('en-IN')}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="corpus" stroke="#00B386" strokeWidth={2} fill="url(#gc)" name="Corpus" />
            <Area type="monotone" dataKey="invested" stroke="#E8EAED" strokeWidth={1.5} fill="none" strokeDasharray="4 3" name="Invested" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
}