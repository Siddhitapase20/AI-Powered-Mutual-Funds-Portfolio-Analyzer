import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

function Portfolio() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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

  const handleAddFund = async () => {
    if (!newFund.fund_name || !newFund.invested_amount) return;
    try {
      await api.post('/portfolio', newFund);
      setNewFund({ fund_name: '', category: 'Equity', invested_amount: '' });
      setShowAdd(false);
      fetchPortfolio();
    } catch (err) {
      alert('Failed to add fund.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this fund from portfolio?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      alert('Failed to delete fund.');
    }
  };

  if (loading) return <DashboardLayout title="My Portfolio"><div className="loading">Loading...</div></DashboardLayout>;

  const funds = summary?.funds || [];

  return (
    <DashboardLayout title="My Portfolio" subtitle="All your mutual fund holdings">
      <div className="grid4" style={{ marginBottom: '1.5rem' }}>
        <div className="metric">
          <div className="metric-lbl">Total invested</div>
          <div className="metric-val">₹{summary?.totalInvested?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Current value</div>
          <div className="metric-val">₹{summary?.currentValue?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Absolute return</div>
          <div className="metric-val">{summary?.totalReturn || 0}%</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Fund count</div>
          <div className="metric-val">{summary?.fundCount || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Holdings
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add fund'}
          </button>
        </div>

        {showAdd && (
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <label>Fund name</label>
              <input type="text" value={newFund.fund_name} onChange={e => setNewFund({ ...newFund, fund_name: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Category</label>
              <select value={newFund.category} onChange={e => setNewFund({ ...newFund, category: e.target.value })}>
                <option>Equity</option><option>Debt</option><option>Hybrid</option><option>ELSS</option><option>Index</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Amount (₹)</label>
              <input type="number" value={newFund.invested_amount} onChange={e => setNewFund({ ...newFund, invested_amount: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={handleAddFund}>Save</button>
          </div>
        )}

        {funds.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>No funds yet. Click "+ Add fund" to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Fund</th><th>Category</th><th>Invested</th><th>Current</th><th>P&L</th><th></th></tr>
            </thead>
            <tbody>
              {funds.map(f => {
                const invested = parseFloat(f.invested_amount);
                const current = parseFloat(f.current_value || f.invested_amount);
                const pnl = current - invested;
                return (
                  <tr key={f.id}>
                    <td><strong>{f.fund_name}</strong></td>
                    <td><span className={`cat-badge cat-${f.category.toLowerCase()}`}>{f.category}</span></td>
                    <td>₹{invested.toLocaleString('en-IN')}</td>
                    <td>₹{current.toLocaleString('en-IN')}</td>
                    <td className={pnl >= 0 ? 'pos' : 'neg'}>{pnl >= 0 ? '+' : ''}₹{Math.round(pnl).toLocaleString('en-IN')}</td>
                    <td>
                      <button className="btn-del" style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => handleDelete(f.id)}>Remove</button>
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

export default Portfolio;