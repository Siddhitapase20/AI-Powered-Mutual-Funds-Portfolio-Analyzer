import React, {useState} from 'react';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';
import './DashboardLayout.css';

function DashboardLayout({children, title, subtitle}) {
    const [chatOpen, setChatOpen] = useState(false);

    return(
        <div className="dash-layout">
            <Sidebar />

            <div className="dash-main">
                <div className="dash-header">
                    <div>
                        <h2 className="dash-title">{title}</h2>
                        {subtitle && (
                            <p className="dash-sub">{subtitle}</p>
                        )}
                    </div>
                </div>

                <div className="dash-content">
                    {children}
                </div>
            </div>

            {/* Floating Chat Button */}
            <button
                className="chat-feb"
                onClick={() => setChatOpen(!chatOpen)}
                title="Ask AI"
            >
                💬
            </button>

            {chatOpen && (
                <ChatBot onClose={() => setChatOpen(false)} />
            )}
        </div>
    );
}

export default DashboardLayout;