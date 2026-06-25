import React, {useState, useRef, useEffect} from 'react';

import './ChatBot.css';

function ChatBot({onClose}){
    const [messages, setMessages]=useState([
        {
            role:'bot',
            text: 'Hi! I am your FundSense AI advisor. Ask me anything about your portfolio, SIP, or mutual funds!'
        
        }
    ]);
    const [input, setInput]=useState('');
    const [loading, setLoading]=useState(false);
    const bottomRef=useRef(null);

    useEffect(()=> {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const sendMessage = async () => {
  if (!input.trim() || loading) return;

  const userMessage = input.trim();
  setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
  setInput('');
  setLoading(true);

  // Temporary mock response until backend is ready
  const mockReplies = [
    'Based on your moderate risk profile, I recommend adding Parag Parikh Flexi Cap to reduce overlap.',
    'Your XIRR of 16.2% is above the large-cap category average. Good performance overall.',
    'To build ₹50L in 10 years at 12% CAGR, you need a monthly SIP of ₹22,244.',
    'Your portfolio has 42% overlap between Mirae and Axis Bluechip. Consider replacing one of them.',
    'For 80C tax saving, Mirae Asset ELSS Tax Saver is a good option with strong 5Y returns.',
  ];

  setTimeout(() => {
    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setLoading(false);
  }, 1000);
};
    return(
        <div className="chatbot-panel">
        <div className="chatbot-header">
        <div>
        <h4> FundSense AI ✦  </h4>
        <small>Powered by Gemini</small>
        </div>
        <button className="chatbot-close" onClick={onClose}>✕</button>
        </div>
        <div className="chatbot-messages">
        {messages.map((msg,i)=>(
            <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.text}
            </div>
    ))}
    {loading && (
        <div className="chat-msg bot typing">AI is thinking...</div> 
       )}
       <div ref={bottomRef}/>
    </div>
    <div className="chatbot-input-row">
    <input 
    type="text"
    value={input}
    placeholder="Ask about your portfolio..."
    onChange={e => setInput(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && sendMessage()}
    />
    <button onClick={sendMessage} disabled={loading}>→</button>
    </div>
</div>
    );
}
export default ChatBot;
