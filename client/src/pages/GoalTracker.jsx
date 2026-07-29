import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

const GOAL_ICONS = {
  'Retirement': '🏖',
  'Child education': '🎓',
  'Home purchase': '🏠',
  'Wealth creation': '📈',
  'Emergency fund': '🛡',
  'Tax saving': '💰',
  'Vehicle': '🚗',
  'Wedding': '💍',
  'Travel': '✈️',
  'Other': '🎯',
};

export default function GoalTracker() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    goal_name: '',
    target_amount: '',
    target_date: '',
    monthly_sip: '',
  });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.goal_name || !form.target_amount || !form.target_date) {
      alert('Please fill goal name, target amount and date.');
      return;
    }
    try {
      await api.post('/goals', form);
      setForm({ goal_name: '', target_amount: '', target_date: '', monthly_sip: '' });
      setShowAdd(false);
      fetchGoals();
    } catch (err) {
      alert('Failed to add goal.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount), 0);
  const totalCurrent = goals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
  const onTrackCount = goals.filter(g => g.isOnTrack).length;

  if (loading) return <DashboardLayout title="Goal Tracker"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout
      title="Goal Tracker"
      subtitle="Track progress toward your financial goals"
      action={
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add goal'}
        </button>
      }
    >
      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="metric-card green">
          <div className="metric-icon green">🎯</div>
          <div className="metric-label">Total goals</div>
          <div className="metric-value">{goals.length}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue">💰</div>
          <div className="metric-label">Total target</div>
          <div className="metric-value" style={{ fontSize: 18 }}>₹{(totalTarget / 100000).toFixed(1)}L</div>
        </div>
        <div className="metric-card gold">
          <div className="metric-icon gold">📊</div>
          <div className="metric-label">Accumulated</div>
          <div className="metric-value" style={{ fontSize: 18 }}>₹{(totalCurrent / 100000).toFixed(1)}L</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">✅</div>
          <div className="metric-label">On track</div>
          <div className="metric-value">{onTrackCount}/{goals.length}</div>
        </div>
      </div>

      {/* Add goal form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Create new goal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Goal name</label>
              <select
                className="form-input"
                value={form.goal_name}
                onChange={e => setForm({ ...form, goal_name: e.target.value })}
              >
                <option value="">Select goal type</option>
                {Object.keys(GOAL_ICONS).map(g => (
                  <option key={g} value={g}>{GOAL_ICONS[g]} {g}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target amount (₹)</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 5000000"
                value={form.target_amount}
                onChange={e => setForm({ ...form, target_amount: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target date</label>
              <input
                className="form-input"
                type="date"
                value={form.target_date}
                onChange={e => setForm({ ...form, target_date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Current monthly SIP (₹)</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 10000"
                value={form.monthly_sip}
                onChange={e => setForm({ ...form, monthly_sip: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save goal</button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No goals yet</div>
            <div className="empty-state-sub">Add your first financial goal to start tracking progress</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {goals.map(g => {
            const icon = GOAL_ICONS[g.goal_name] || '🎯';
            const progressColor = g.progress >= 75 ? '#00B386' : g.progress >= 40 ? '#F59E0B' : '#EF4444';

            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'var(--green-bg)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{g.goal_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Target: {new Date(g.target_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {g.yearsLeft} years left
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: g.isOnTrack ? 'var(--green-bg)' : 'var(--red-bg)', color: g.isOnTrack ? 'var(--green-dark)' : 'var(--red)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {g.isOnTrack ? '✓ On track' : '⚠ Behind'}
                    </span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>✕</button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--muted)' }}>Progress</span>
                    <span style={{ fontWeight: 700, color: progressColor }}>{g.progress}%</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${g.progress}%`, background: progressColor, borderRadius: 5, transition: 'width .5s ease' }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Target</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>₹{(parseFloat(g.target_amount) / 100000).toFixed(1)}L</div>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Accumulated</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>₹{(parseFloat(g.current_amount) / 100000).toFixed(1)}L</div>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Required SIP</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>₹{g.requiredSIP?.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Your SIP</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: g.isOnTrack ? 'var(--green)' : 'var(--red)' }}>
                      ₹{parseFloat(g.monthly_sip || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {!g.isOnTrack && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--red-bg)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>
                    ⚠ Increase your SIP by ₹{Math.max(0, g.requiredSIP - (g.monthly_sip || 0)).toLocaleString('en-IN')}/month to stay on track for this goal.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}