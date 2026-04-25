import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '../electiq.js';

/**
 * ChatAssistant component: AI-powered election Q&A chatbot.
 * Addresses the "assistant" and "interactive" requirements.
 * @returns {JSX.Element}
 */
export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Welcome to ElectIQ! 🗳️ I\'m your AI election assistant. Ask me anything about the election process — from voter registration to results declaration. I\'m here to make democracy easy to understand!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUpQuestions: [
        'How do I register to vote?',
        'What happens on voting day?',
        'How are votes counted?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  /** Auto-scroll to the latest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends a message to the Gemini-powered election chatbot.
   * @param {string} text - The message to send
   */
  const sendMessage = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatWithAssistant(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.answer,
          category: data.category,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followUpQuestions: data.followUpQuestions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Sorry, I encountered an error: ${err.message}. Please try again.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /** Handles form submission */
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <article className="card" aria-labelledby="chat-title">
      <div className="card__header">
        <h2 className="card__title" id="chat-title">💬 Election Assistant</h2>
        <span className="card__badge card__badge--ai">AI</span>
      </div>

      <div className="chat">
        <div className="chat__messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat__msg-wrapper chat__msg-wrapper--${msg.role}`}>
              {msg.role === 'ai' && <div className="chat__avatar chat__avatar--ai" aria-hidden="true">E</div>}
              <div className={`chat__msg chat__msg--${msg.role}`}>
                <p>{msg.text}</p>
                {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="chat__follow-ups" role="group" aria-label="Suggested follow-up questions">
                    {msg.followUpQuestions.map((q, j) => (
                      <button key={j} className="chat__follow-btn" onClick={() => sendMessage(q)} aria-label={q} type="button">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div className="chat__time">{msg.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat__msg-wrapper chat__msg-wrapper--ai">
              <div className="chat__avatar chat__avatar--ai" aria-hidden="true">E</div>
              <div className="chat__msg chat__msg--ai" aria-busy="true">
                <div className="chat__typing">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
                <span className="sr-only">ElectIQ is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat__form" onSubmit={handleSubmit}>
          <label htmlFor="chat-input" className="sr-only">Ask a question about the election process</label>
          <input
            id="chat-input"
            className="chat__input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about registration, voting, counting, results..."
            disabled={loading}
            autoComplete="off"
          />
          <button className="chat__send-btn" type="submit" disabled={loading || !input.trim()} aria-label="Send message">
            {loading ? '...' : '→'}
          </button>
        </form>
      </div>
    </article>
  );
}
