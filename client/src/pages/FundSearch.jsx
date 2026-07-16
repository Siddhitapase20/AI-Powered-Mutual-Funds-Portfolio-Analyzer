import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FundSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundData, setFundData] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(true);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchMarketOverview();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/fund-search/search?q=${query}`);
        setSuggestions(res.data.funds);
      } catch { setSuggestions([]); }
    }, 400);
  }, [query]);

  const fetchMarketOverview = async () => {
    try {
      const res = await api.get('/fund-search/market-overview');
      setMarketData(res.data.funds);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketLoading(false);
    }
  };

  const selectFund = async (fund) => {
    setSuggestions([]);
    setQuery(fund.schemeName);
    setSelectedFund(fund);
    setLoading(true);
    setFundData(null);
    try {
      const res = await api.get(`/fund-search/details/${fund.schemeCode}`);
      setFundData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = fundData?.historicalNAV?.slice(0, 90).reverse().map(d => ({
    date: d.date,
    nav: parseFloat(d.nav),
  })) || [];

  const getReturnColor = (val) => {
    if (!val) return 'var(--muted)';
    return parseFloat(val) >= 0 ? 'var(--green)' : 'var(--red)';
  };

  return (
    <DashboardLayout title="Fund Search" subtitle="Search 5000+ mutual funds with live NAV and returns">

      {/* Search box */}
      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 540 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--muted)' }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: 42, fontSize: 15, borderRadius: 12, height: 48 }}
            placeholder="Search mutual funds... e.g. Mirae, Parag Parikh, HDFC"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: 320, overflowY: 'auto', marginTop: 4 }}>
            {suggestions.map((f, i) => (
              <div
                key={i}
                onClick={() => selectFund(f)}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13, transition: 'background .1s' }}
                onMouseEnter={e => e.target.style.background = 'var(--bg)'}
                onMouseLeave={e => e.target.style.background = '#fff'}
              >
                <div style={{ fontWeight: 600 }}>{f.schemeName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Code: {f.schemeCode}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fund details */}
      {loading && <div className="loading"><div className="spinner" /><span>Fetching live fund data...</span></div>}

      {fundData && !loading && (
        <div style={{ marginBottom: 24 }}>
          {/* Fund header */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{fundData.meta.schemeName}</h3>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{fundData.meta.fundHouse} · {fundData.meta.schemeCategory}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>₹{fundData.nav.current.toFixed(4)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>NAV as of {fundData.nav.date}</div>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
            {[['1W', '1 Week'], ['1M', '1 Month'], ['3M', '3 Month'], ['1Y', '1 Year'], ['3Y', '3 Year CAGR'], ['5Y', '5 Year CAGR']].map(([key, label]) => (
              <div key={key} className="card" style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: getReturnColor(fundData.returns[key]) }}>
                  {fundData.returns[key] ? `${parseFloat(fundData.returns[key]) >= 0 ? '+' : ''}${fundData.returns[key]}%` : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* NAV chart */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">NAV trend — last 90 days</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={14} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip formatter={v => [`₹${v.toFixed(4)}`, 'NAV']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="nav" stroke="#00B386" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Market overview */}
      {!selectedFund && (
        <div className="card">
          <div className="card-title">Market pulse — popular funds today</div>
          {marketLoading ? (
            <div className="loading" style={{ height: 100 }}><div className="spinner" /></div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr><th>Fund</th><th>Category</th><th>NAV</th><th>Day change</th></tr>
              </thead>
              <tbody>
                {marketData.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</td>
                    <td><span className={`badge badge-${f.category.toLowerCase().replace(' ', '-')}`}>{f.category}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{f.nav.toFixed(4)}</td>
                    <td>
                      <span style={{ color: f.dayChange >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {f.dayChange >= 0 ? '▲' : '▼'} {Math.abs(f.dayChange).toFixed(3)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}