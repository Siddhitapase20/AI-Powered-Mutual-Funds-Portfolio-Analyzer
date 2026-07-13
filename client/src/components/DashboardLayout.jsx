import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';

export default function DashboardLayout({ children, title, subtitle, action }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="dash-layout">
      <Sidebar />
      <div className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">{title}</h1>
            {subtitle && <p className="dash-sub">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div className="dash-content fade-up">{children}</div>
      </div>
      <button className="chat-fab" onClick={() => setChatOpen(!chatOpen)} title="Ask AI">💬</button>
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </div>
  );
}