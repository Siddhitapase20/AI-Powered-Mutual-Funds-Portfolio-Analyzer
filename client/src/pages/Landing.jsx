import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">Fund<span>Sense</span></div>
        <div className="landing-nav-links">
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get started →</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-text fade-up">
          <div className="hero-badge">✦ AI-Powered Advisory</div>
          <h1>Smart investing,<br /><em>guided by AI</em></h1>
          <p>Stop guessing which mutual funds to pick. FundSense analyzes your portfolio, risk profile, and goals to give you personalized recommendations.</p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Analyze my portfolio →</button>
            <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>

        <div className="hero-card-wrap fade-up">
          <div className="hero-preview-card">
            <div className="hpc-header">
              <span>Portfolio health</span>
              <div className="hpc-score">79</div>
            </div>
            {[
              { name: 'Mirae Asset Large Cap', ret: '+18.4%', pos: true },
              { name: 'Parag Parikh Flexi Cap', ret: '+22.1%', pos: true },
              { name: 'HDFC Short Term Debt', ret: '−1.2%', pos: false },
            ].map((f, i) => (
              <div key={i} className="hpc-fund">
                <span className="hpc-dot" />
                <span className="hpc-name">{f.name}</span>
                <span className={f.pos ? 'pos' : 'neg'}>{f.ret}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-tag">Core features</div>
        <h2 className="section-title">Everything you need to invest smarter</h2>
        <div className="features-grid">
          {[
            { icon: '🤖', title: 'AI Fund Recommendations', desc: 'Personalized fund picks with full reasoning based on your profile.' },
            { icon: '📊', title: 'Portfolio Dashboard', desc: 'Complete investment summary — value, returns, XIRR in one place.' },
            { icon: '🔍', title: 'Overlap Checker', desc: 'Detects duplicate stock holdings across your mutual funds.' },
            { icon: '🎯', title: 'SIP Calculator', desc: 'Enter your goal — get the exact monthly SIP needed.' },
            { icon: '⚖️', title: 'Risk Profiling', desc: '5-question quiz that classifies your investor risk level.' },
            { icon: '📈', title: 'Performance Analytics', desc: '1Y, 3Y, 5Y CAGR with Nifty 50 benchmark comparison.' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to analyze your portfolio?</h2>
        <p>Takes 3 minutes. No credit card required.</p>
        <button className="btn btn-primary btn-full" style={{ maxWidth: 240, margin: '0 auto' }} onClick={() => navigate('/register')}>
          Start free analysis →
        </button>
      </section>
    </div>
  );
}

export default Landing;