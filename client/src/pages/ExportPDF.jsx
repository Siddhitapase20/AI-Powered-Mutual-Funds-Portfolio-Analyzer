import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

function ExportPDF() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    api.get('/portfolio/summary').then(res => setSummary(res.data));
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('FundSense — Portfolio Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Name: ${user?.name}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 39);

    doc.setFontSize(14);
    doc.text('Portfolio Summary', 14, 52);
    doc.setFontSize(11);
    doc.text(`Total Invested: Rs ${summary?.totalInvested?.toLocaleString('en-IN')}`, 14, 60);
    doc.text(`Current Value: Rs ${summary?.currentValue?.toLocaleString('en-IN')}`, 14, 67);
    doc.text(`Total Return: ${summary?.totalReturn}%`, 14, 74);
    doc.text(`Health Score: ${summary?.healthScore}/100`, 14, 81);

    doc.setFontSize(14);
    doc.text('Holdings', 14, 95);
    doc.setFontSize(10);
    let y = 103;
    (summary?.funds || []).forEach(f => {
      doc.text(`${f.fund_name} (${f.category}) — Invested: Rs ${f.invested_amount}`, 14, y);
      y += 7;
    });

    doc.setFontSize(8);
    doc.text('Disclaimer: AI-generated report for informational purposes only. Not SEBI-registered advice.', 14, 280);

    doc.save('FundSense_Portfolio_Report.pdf');
  };

  return (
    <DashboardLayout title="Export PDF Report" subtitle="Download your complete portfolio report">
      <button className="btn btn-primary" onClick={downloadPDF} style={{ marginBottom: '1.5rem' }}>
        🖨 Download PDF
      </button>

      <div ref={printRef} className="card" style={{ maxWidth: 600 }}>
        <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Fund<span style={{ color: 'var(--gold)' }}>Sense</span></h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.name} · {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="grid4" style={{ marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>₹{summary?.totalInvested?.toLocaleString('en-IN') || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Invested</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--green)' }}>₹{summary?.currentValue?.toLocaleString('en-IN') || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Current</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{summary?.totalReturn || 0}%</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Returns</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold)' }}>{summary?.healthScore || 0}/100</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Score</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ExportPDF;