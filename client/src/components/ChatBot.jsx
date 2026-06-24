import React, {useState, useRef, useEffect} from 'react';
import api from '../utils/api';
import './ChatBot';

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
        const userMsg = { role: 'user', text: userMessage};
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', {message: userMessage});
            setMessages(prev => [
                ...prev,
                { role: 'bot', text: res.data.reply }
            ]);
        } catch (err) {
            setMessages (prev => [
                ...prev,
                {role: 'bot', text: 'Sorry, could not process that. Please try again.'}
            ]);
        } finally {
            setLoading(false);
        }
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
        <div className="chatbot-message">
        {message.map((msg,i)=>(
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
