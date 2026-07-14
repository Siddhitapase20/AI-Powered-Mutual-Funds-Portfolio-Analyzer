import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import jsPDF from 'jspdf';

export default function ExportPDF() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => { api.get('/portfolio/summary').then(r => setSummary(r.data)); }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const green = [0, 179, 134];
    const ink = [13, 15, 18];
    const muted = [107, 114, 128];

    // Header
    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FundSense', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Mutual Fund Advisor — Portfolio Report', 14, 23);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 16);
    doc.text(`Investor: ${user?.name}`, 140, 23);

    // Summary
    doc.setTextColor(...ink);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Summary', 14, 42);

    const metrics = [
      ['Total Invested', `Rs ${summary?.totalInvested?.toLocaleString('en-IN') || 0}`],
      ['Current Value', `Rs ${summary?.currentValue?.toLocaleString('en-IN') || 0}`],
      ['Total Return', `${summary?.totalReturn || 0}%`],
      ['Health Score', `${summary?.healthScore || 0}/100`],
    ];

    metrics.forEach(([label, value], i) => {
      const x = 14 + (i % 2) * 96;
      const y = 52 + Math.floor(i / 2) * 18;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(x, y - 4, 88, 14, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(label, x + 4, y + 2);
      doc.setFontSize(11);
      doc.setTextColor(...ink);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 4, y + 8);
    });

    // Holdings
    doc.setFontSize(13);
    doc.setTextColor(...ink);
    doc.text('Holdings', 14, 100);

    const funds = summary?.funds || [];
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    ['Fund Name', 'Category', 'Invested', 'Current', 'Return'].forEach((h, i) => {
      doc.text(h, [14, 70, 110, 140, 170][i], 108);
    });
    doc.setDrawColor(232, 234, 237);
    doc.line(14, 110, 196, 110);

    let y = 118;
    funds.forEach(f => {
      const inv = parseFloat(f.invested_amount);
      const cur = parseFloat(f.current_value || f.invested_amount);
      const ret = (((cur - inv) / inv) * 100).toFixed(1);
      doc.setTextColor(...ink);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const name = f.fund_name.length > 30 ? f.fund_name.substring(0, 28) + '...' : f.fund_name;
      doc.text(name, 14, y);
      doc.text(f.category, 110, y);
      doc.text(`Rs ${inv.toLocaleString('en-IN')}`, 140, y);
      doc.text(`Rs ${cur.toLocaleString('en-IN')}`, 170, y);
      parseFloat(ret) >= 0 ? doc.setTextColor(...green) : doc.setTextColor(229, 62, 62);
      doc.text(`${parseFloat(ret) >= 0 ? '+' : ''}${ret}%`, 190, y);
      doc.setDrawColor(241, 243, 245);
      doc.line(14, y + 3, 196, y + 3);
      y += 12;
    });

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'italic');
    doc.text('Disclaimer: This is an AI-generated report for informational purposes only. Not SEBI-registered financial advice.', 14, 278);
    doc.text('Mutual fund investments are subject to market risks. Read all scheme documents carefully before investing.', 14, 284);

    doc.save('FundSense_Portfolio_Report.pdf');
  };

  return (
    <DashboardLayout title="Export PDF" subtitle="Download your complete investment report">
      <div style={{ maxWidth: 680 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Portfolio Report</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Complete summary with holdings, returns, and AI insights</div>
            </div>
            <button className="btn btn-primary" onClick={downloadPDF} style={{ fontSize: 15, padding: '11px 24px' }}>
              ⬇ Download PDF
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="pdf-report">
          <div className="pdf-header">
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Fund<span style={{ color: 'var(--green)' }}>Sense</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>AI Mutual Fund Advisor</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>Portfolio Report</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div className="pdf-section-title">Portfolio summary</div>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              ['Invested', `₹${summary?.totalInvested?.toLocaleString('en-IN') || 0}`, 'var(--ink)'],
              ['Current', `₹${summary?.currentValue?.toLocaleString('en-IN') || 0}`, 'var(--green)'],
              ['Return', `${summary?.totalReturn || 0}%`, 'var(--green)'],
              ['Score', `${summary?.healthScore || 0}/100`, 'var(--gold)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          <div className="pdf-section-title">Holdings</div>
          <table className="fin-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Fund</th><th>Category</th><th>Invested</th><th>Current</th><th>Return</th></tr></thead>
            <tbody>
              {(summary?.funds || []).map(f => {
                const inv = parseFloat(f.invested_amount);
                const cur = parseFloat(f.current_value || f.invested_amount);
                const ret = (((cur - inv) / inv) * 100).toFixed(1);
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.fund_name}</td>
                    <td>{f.category}</td>
                    <td>₹{inv.toLocaleString('en-IN')}</td>
                    <td>₹{cur.toLocaleString('en-IN')}</td>
                    <td className={parseFloat(ret) >= 0 ? 'pos' : 'neg'}>{parseFloat(ret) >= 0 ? '+' : ''}{ret}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            ⚠ Disclaimer: This is an AI-generated report for informational purposes only. Not SEBI-registered financial advice. Mutual fund investments are subject to market risks. Read all scheme documents carefully before investing.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}