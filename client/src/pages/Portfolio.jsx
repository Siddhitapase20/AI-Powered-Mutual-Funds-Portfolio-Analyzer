import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function Portfolio() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newFund, setNewFund] = useState({ fund_name: '', category: 'Equity', invested_amount: '' });

  useEffect(() => { fetchPortfolio(); }, []);

  

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/portfolio/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleAdd = async () => {
    if (!newFund.fund_name || !newFund.invested_amount) return;
    setAdding(true);
    try {
      await api.post('/portfolio', newFund);
      setNewFund({ fund_name: '', category: 'Equity', invested_amount: '' });
      setShowAdd(false);
      fetchPortfolio();
    } catch (err) {
      alert('Failed to add fund.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this fund?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      alert('Failed to remove fund.');
    }
  };

  if (loading) return <DashboardLayout title="My Portfolio"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  const funds = summary?.funds || [];
  const totalInvested = summary?.totalInvested || 0;
  const currentValue = summary?.currentValue || 0;
  const gain = currentValue - totalInvested;
  const gainPct = totalInvested ? ((gain / totalInvested) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout
      title="My Portfolio"
      subtitle="All your mutual fund holdings"
      action={
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Fund'}
        </button>
      }
    >
      {/* Metrics */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric-card green">
          <div className="metric-icon green">💰</div>
          <div className="metric-label">Total Invested</div>
          <div className="metric-value">₹{totalInvested.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue">📊</div>
          <div className="metric-label">Current Value</div>
          <div className="metric-value">₹{currentValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-card gold">
          <div className="metric-icon gold">💹</div>
          <div className="metric-label">Total Gain/Loss</div>
          <div className="metric-value" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {gain >= 0 ? '+' : ''}₹{Math.round(Math.abs(gain)).toLocaleString('en-IN')}
          </div>
          <div className={`metric-badge ${gain >= 0 ? 'up' : 'dn'}`}>{gain >= 0 ? '+' : ''}{gainPct}%</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">📦</div>
          <div className="metric-label">Total Funds</div>
          <div className="metric-value">{funds.length}</div>
          <div className="metric-badge neutral">Active holdings</div>
        </div>
      </div>

      {/* Add fund form */}
      {showAdd && (
  <div className="card" style={{ marginBottom: 16 }}>
    <div className="card-title">Add new fund</div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Fund name</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. Mirae Asset Large Cap Fund"
          value={newFund.fund_name}
          onChange={e => setNewFund({ ...newFund, fund_name: e.target.value })}
        />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Category</label>
        <select
          className="form-input"
          value={newFund.category}
          onChange={e => setNewFund({ ...newFund, category: e.target.value })}
        >
          <option value="Equity">Equity</option>
          <option value="Debt">Debt</option>
          <option value="Hybrid">Hybrid</option>
          <option value="ELSS">ELSS</option>
          <option value="Index">Index</option>
        </select>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Sub-category</label>
        <select
          className="form-input"
          value={newFund.sub_category || ''}
          onChange={e => setNewFund({ ...newFund, sub_category: e.target.value })}
        >
          <option value="">Select sub-category</option>
          {newFund.category === 'Equity' && <>
            <option value="Large Cap">Large Cap</option>
            <option value="Mid Cap">Mid Cap</option>
            <option value="Small Cap">Small Cap</option>
            <option value="Flexi Cap">Flexi Cap</option>
            <option value="Multi Cap">Multi Cap</option>
            <option value="Sectoral">Sectoral / Thematic</option>
            <option value="International">International</option>
          </>}
          {newFund.category === 'ELSS' && <>
            <option value="ELSS Tax Saver">ELSS Tax Saver</option>
          </>}
          {newFund.category === 'Index' && <>
            <option value="Nifty 50">Nifty 50</option>
            <option value="Nifty Next 50">Nifty Next 50</option>
            <option value="Nifty Midcap 150">Nifty Midcap 150</option>
            <option value="Nifty Smallcap 250">Nifty Smallcap 250</option>
            <option value="Sensex">Sensex</option>
          </>}
          {newFund.category === 'Debt' && <>
            <option value="Liquid">Liquid</option>
            <option value="Overnight">Overnight</option>
            <option value="Short Duration">Short Duration</option>
            <option value="Medium Duration">Medium Duration</option>
            <option value="Corporate Bond">Corporate Bond</option>
            <option value="Gilt">Gilt</option>
          </>}
          {newFund.category === 'Hybrid' && <>
            <option value="Balanced Advantage">Balanced Advantage</option>
            <option value="Aggressive Hybrid">Aggressive Hybrid</option>
            <option value="Conservative Hybrid">Conservative Hybrid</option>
            <option value="Arbitrage">Arbitrage</option>
          </>}
        </select>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Amount invested (₹)</label>
        <input
          className="form-input"
          type="number"
          placeholder="e.g. 50000"
          value={newFund.invested_amount}
          onChange={e => setNewFund({ ...newFund, invested_amount: e.target.value })}
        />
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
        {adding ? 'Saving...' : '+ Save fund'}
      </button>
    </div>
  </div>
)}

      {/* Holdings table */}
      <div className="card">
        <div className="card-title">Holdings <span className="card-subtitle">Live NAV · AMFI</span></div>
        {funds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">No funds yet</div>
            <div className="empty-state-sub">Click "+ Add Fund" to start building your portfolio</div>
          </div>
        ) : (
          <table className="fin-table">
            <thead>
              <tr><th>Fund</th><th>Category</th><th>Invested</th><th>Current value</th><th>Gain / Loss</th><th>Return</th><th></th></tr>
            </thead>
            <tbody>
              {funds.map(f => {
                const inv = parseFloat(f.invested_amount);
                const cur = parseFloat(f.current_value || f.invested_amount);
                const gl = cur - inv;
                const ret = ((gl / inv) * 100).toFixed(1);
                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{f.fund_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Direct · Growth</div>
                    </td>
                    <td><span className={`badge badge-${f.category.toLowerCase()}`}>{f.category}</span></td>
                    <td style={{ fontWeight: 500 }}>₹{inv.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{cur.toLocaleString('en-IN')}</td>
                    <td className={gl >= 0 ? 'pos' : 'neg'}>{gl >= 0 ? '+' : ''}₹{Math.round(Math.abs(gl)).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ background: parseFloat(ret) >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', color: parseFloat(ret) >= 0 ? 'var(--green)' : 'var(--red)', padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {parseFloat(ret) >= 0 ? '+' : ''}{ret}%
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}