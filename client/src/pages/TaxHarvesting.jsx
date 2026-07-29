import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function TaxHarvesting() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rebalancing/tax')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Tax Harvesting"><div className="loading"><div className="spinner" /></div></DashboardLayout>;

  const s = data?.summary;

  return (
    <DashboardLayout
      title="Tax Harvesting"
      subtitle="Understand your tax liability and save more"
    >
      {/* Tax summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="metric-card green">
          <div className="metric-icon green">📈</div>
          <div className="metric-label">Total LTCG</div>
          <div className="metric-value" style={{ fontSize: 18 }}>₹{(s?.totalLTCG || 0).toLocaleString('en-IN')}</div>
          <div className="metric-badge neutral">Long term gains</div>
        </div>
        <div className="metric-card gold">
          <div className="metric-icon gold">⚡</div>
          <div className="metric-label">Total STCG</div>
          <div className="metric-value" style={{ fontSize: 18 }}>₹{(s?.totalSTCG || 0).toLocaleString('en-IN')}</div>
          <div className="metric-badge neutral">Short term gains</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue">🧾</div>
          <div className="metric-label">Tax liability</div>
          <div className="metric-value" style={{ fontSize: 18, color: 'var(--red)' }}>₹{(s?.totalTaxLiability || 0).toLocaleString('en-IN')}</div>
          <div className="metric-badge dn">Estimated</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">💡</div>
          <div className="metric-label">Potential saving</div>
          <div className="metric-value" style={{ fontSize: 18, color: 'var(--green)' }}>₹{(s?.potentialTaxSaving || 0).toLocaleString('en-IN')}</div>
          <div className="metric-badge up">Via harvesting</div>
        </div>
      </div>

      {/* LTCG exemption info */}
      <div style={{ background: 'linear-gradient(135deg, #0C1B14, #0A1628)', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>LTCG tax exemption status (₹1L per financial year)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, background: 'rgba(255,255,255,.1)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(((s?.ltcgExemptionUsed || 0) / 100000) * 100, 100)}%`, background: (s?.ltcgExemptionUsed || 0) >= 100000 ? '#EF4444' : '#00B386', borderRadius: 5 }} />
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#00B386', whiteSpace: 'nowrap' }}>
            ₹{(s?.ltcgExemptionUsed || 0).toLocaleString('en-IN')} / ₹1,00,000
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
          {(s?.ltcgExemptionUsed || 0) < 100000
            ? `₹${(100000 - (s?.ltcgExemptionUsed || 0)).toLocaleString('en-IN')} of exemption remaining this financial year`
            : '⚠ LTCG exemption fully used. Gains above ₹1L taxed at 10%.'}
        </div>
      </div>

      {/* Tax rates info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { type: 'Equity LTCG', rate: '10%', period: 'Held > 12 months', color: 'var(--green)', note: '₹1L exempt per year' },
          { type: 'Equity STCG', rate: '15%', period: 'Held < 12 months', color: 'var(--gold)', note: 'No exemption' },
          { type: 'Debt funds', rate: 'Slab rate', period: 'Any holding period', color: 'var(--blue)', note: 'As per income tax slab' },
        ].map((t, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.type}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: t.color, marginBottom: 4 }}>{t.rate}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t.period}</div>
            <div style={{ fontSize: 11, background: 'var(--bg)', borderRadius: 6, padding: '4px 8px', color: 'var(--muted)' }}>{t.note}</div>
          </div>
        ))}
      </div>

      {/* Fund-level tax analysis */}
      <div className="card">
        <div className="card-title">Fund-wise tax analysis</div>
        {!data?.taxAnalysis?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-sub">Add funds to see tax analysis</div>
          </div>
        ) : (
          <table className="fin-table">
            <thead>
              <tr>
                <th>Fund</th>
                <th>Holding</th>
                <th>Gain/Loss</th>
                <th>Tax type</th>
                <th>Tax rate</th>
                <th>Est. tax</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.taxAnalysis.map((f, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.fund_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.category}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {f.monthsHeld} months
                    <div style={{ fontSize: 11, color: f.isLongTerm ? 'var(--green)' : 'var(--gold)', fontWeight: 600 }}>
                      {f.isLongTerm ? 'Long term' : 'Short term'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: f.gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {f.gain >= 0 ? '+' : ''}₹{Math.abs(f.gain).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.gainPct >= 0 ? '+' : ''}{f.gainPct}%</div>
                  </td>
                  <td>
                    <span style={{ background: f.taxType.includes('LTCG') ? 'var(--green-bg)' : 'var(--gold-bg)', color: f.taxType.includes('LTCG') ? 'var(--green-dark)' : '#92400E', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {f.taxType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{f.taxRate}%</td>
                  <td style={{ fontWeight: 700, color: f.estimatedTax > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {f.estimatedTax > 0 ? `₹${f.estimatedTax.toLocaleString('en-IN')}` : 'No tax'}
                  </td>
                  <td>
                    {f.gain < 0 && f.harvestOpportunity > 0 ? (
                      <span style={{ background: 'var(--blue-bg)', color: '#1D4ED8', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        💡 Harvest loss
                      </span>
                    ) : f.estimatedTax > 0 ? (
                      <span style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        Tax due
                      </span>
                    ) : (
                      <span style={{ background: 'var(--green-bg)', color: 'var(--green-dark)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        ✓ Clean
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
        ⚠ <strong>Disclaimer:</strong> Tax calculations are estimates based on standard Indian tax rules (FY 2024-25). Actual tax liability may vary based on your income slab, indexation benefits, and other factors. Consult a CA or tax advisor before making investment decisions based on tax implications.
      </div>
    </DashboardLayout>
  );
}