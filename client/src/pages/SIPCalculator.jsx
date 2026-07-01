import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';

function SIPCalculator() {
  const [corpus, setCorpus] = useState(5000000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState(null);

  useEffect(() => { calculate(); }, [corpus, years, rate]);

  const calculate = () => {
    const mr = (rate / 100) / 12;
    const n = years * 12;
    const needed = Math.round((corpus * mr) / ((Math.pow(1 + mr, n) - 1) * (1 + mr)));
    const totalInvested = needed * n;
    const wealthGain = corpus - totalInvested;
    setResult({ needed, totalInvested, wealthGain });
  };

  return (
    <DashboardLayout title="SIP Calculator" subtitle="Calculate required SIP for your financial goals">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-title">Goal-based calculator</div>

          <div className="slider-group">
            <label>Target corpus <span>₹{corpus.toLocaleString('en-IN')}</span></label>
            <input type="range" min="500000" max="10000000" step="100000" value={corpus}
              onChange={e => setCorpus(parseInt(e.target.value))} />
          </div>

          <div className="slider-group">
            <label>Time period <span>{years} years</span></label>
            <input type="range" min="1" max="30" value={years}
              onChange={e => setYears(parseInt(e.target.value))} />
          </div>

          <div className="slider-group">
            <label>Expected annual return <span>{rate}%</span></label>
            <input type="range" min="6" max="20" step="0.5" value={rate}
              onChange={e => setRate(parseFloat(e.target.value))} />
          </div>
        </div>

        <div style={{ background: 'var(--ink)', color: '#F7F4EE', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: '.5rem' }}>Required monthly SIP</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--gold)' }}>
            ₹{result?.needed.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>
            to reach ₹{(corpus / 100000).toFixed(0)}L in {years} years at {rate}% p.a.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>₹{Math.round(result?.totalInvested / 1000) || 0}K</div>
              <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>Total invested</div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--gold)' }}>₹{Math.round(result?.wealthGain / 1000) || 0}K</div>
              <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>Wealth gained</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SIPCalculator;