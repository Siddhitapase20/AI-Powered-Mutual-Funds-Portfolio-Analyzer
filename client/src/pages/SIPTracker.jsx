import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function SIPTracker() {
  const [funds, setFunds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundStats, setFundStats] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fund_id: '',
    amount: '',
    nav_at_purchase: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'SIP',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fundsRes, txnRes] = await Promise.all([
        api.get('/portfolio/summary'),
        api.get('/sip/all'),
      ]);
      setFunds(fundsRes.data.funds || []);
      setTransactions(txnRes.data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFundStats = async (fundId) => {
    try {
      const res = await api.get(`/sip/xirr/${fundId}`);
      setFundStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectFund = (fund) => {
    setSelectedFund(fund);
    fetchFundStats(fund.id);
  };

  const handleAddTransaction = async () => {
    if (!form.fund_id || !form.amount) {
      alert('Please select a fund and enter amount.');
      return;
    }
    try {
      await api.post('/sip/add', form);
      setShowAdd(false);
      setForm({ fund_id: '', amount: '', nav_at_purchase: '', transaction_date: new Date().toISOString().split('T')[0], transaction_type: 'SIP', notes: '' });
      fetchData();
      if (selectedFund) fetchFundStats(selectedFund.id);
    } catch (err) {
      alert('Failed to add transaction.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/sip/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const fundTransactions = selectedFund
    ? transactions.filter(t => t.fund_id === selectedFund.id)
    : transactions;

  const totalSIPInvested = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalTransactions = transactions.length;

  if (loading) return <DashboardLayout title="SIP Tracker"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout
      title="SIP Tracker"
      subtitle="Track every SIP investment with date, NAV, and units"
      action={
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Log SIP'}
        </button>
      }
    >
      {/* Summary metrics */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric-card green">
          <div className="metric-icon green">💰</div>
          <div className="metric-label">Total via SIP</div>
          <div className="metric-value">₹{totalSIPInvested.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue">📋</div>
          <div className="metric-label">Total transactions</div>
          <div className="metric-value">{totalTransactions}</div>
        </div>
        <div className="metric-card gold">
          <div className="metric-icon gold">📅</div>
          <div className="metric-label">Active SIPs</div>
          <div className="metric-value">{funds.length}</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">📈</div>
          <div className="metric-label">CAGR (est.)</div>
          <div className="metric-value">{fundStats?.xirr || '—'}%</div>
        </div>
      </div>

      {/* Add transaction form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Log SIP transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fund</label>
              <select className="form-input" value={form.fund_id} onChange={e => setForm({ ...form, fund_id: e.target.value })}>
                <option value="">Select fund</option>
                {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" placeholder="e.g. 3000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">NAV at purchase</label>
              <input className="form-input" type="number" step="0.01" placeholder="e.g. 98.43" value={form.nav_at_purchase} onChange={e => setForm({ ...form, nav_at_purchase: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Transaction date</label>
              <input className="form-input" type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="SIP">SIP (Monthly)</option>
                <option value="Lumpsum">Lumpsum</option>
                <option value="Top-up">Top-up</option>
                <option value="Dividend reinvest">Dividend reinvest</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" type="text" placeholder="e.g. Jan 2025 SIP" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          {form.amount && form.nav_at_purchase && (
            <div style={{ background: 'var(--green-bg)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green-dark)', marginBottom: 12 }}>
              Units purchased: <strong>{(parseFloat(form.amount) / parseFloat(form.nav_at_purchase)).toFixed(4)}</strong> units at NAV ₹{form.nav_at_purchase}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddTransaction}>Save transaction</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Fund list */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-title">Your funds</div>
          <div
            onClick={() => { setSelectedFund(null); setFundStats(null); }}
            style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: !selectedFund ? 'var(--green-bg)' : 'transparent', fontSize: 13, fontWeight: 600, color: !selectedFund ? 'var(--green-dark)' : 'var(--ink)' }}
          >
            All funds ({transactions.length})
          </div>
          {funds.map(f => (
            <div
              key={f.id}
              onClick={() => handleSelectFund(f)}
              style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: selectedFund?.id === f.id ? 'var(--green-bg)' : 'transparent', transition: 'all .15s' }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: selectedFund?.id === f.id ? 'var(--green-dark)' : 'var(--ink)' }}>{f.fund_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{f.category}</div>
            </div>
          ))}
        </div>

        {/* Transaction table */}
        <div>
          {selectedFund && fundStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div className="metric-card green">
                <div className="metric-label">Total invested</div>
                <div className="metric-value" style={{ fontSize: 18 }}>₹{fundStats.totalInvested?.toLocaleString('en-IN')}</div>
              </div>
              <div className="metric-card blue">
                <div className="metric-label">Current value</div>
                <div className="metric-value" style={{ fontSize: 18 }}>₹{parseFloat(fundStats.currentValue || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="metric-card gold">
                <div className="metric-label">Abs. return</div>
                <div className="metric-value" style={{ fontSize: 18 }}>{fundStats.absoluteReturn}%</div>
              </div>
              <div className="metric-card purple">
                <div className="metric-label">CAGR (est.)</div>
                <div className="metric-value" style={{ fontSize: 18 }}>{fundStats.xirr}%</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">
              {selectedFund ? `${selectedFund.fund_name} — transactions` : 'All transactions'}
              <span className="card-subtitle">{fundTransactions.length} entries</span>
            </div>
            {fundTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No transactions yet</div>
                <div className="empty-state-sub">Click "+ Log SIP" to record your first investment</div>
              </div>
            ) : (
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fund</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>NAV</th>
                    <th>Units</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fundTransactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.fund_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.category}</div>
                      </td>
                      <td>
                        <span style={{ background: t.transaction_type === 'SIP' ? 'var(--green-bg)' : t.transaction_type === 'Lumpsum' ? 'var(--blue-bg)' : 'var(--gold-bg)', color: t.transaction_type === 'SIP' ? 'var(--green-dark)' : t.transaction_type === 'Lumpsum' ? '#1D4ED8' : '#92400E', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(t.amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {t.nav_at_purchase > 0 ? `₹${parseFloat(t.nav_at_purchase).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {t.units_purchased > 0 ? parseFloat(t.units_purchased).toFixed(4) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.notes || '—'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}