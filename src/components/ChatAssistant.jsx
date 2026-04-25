/**
 * @fileoverview ChatAssistant component — AI-powered election Q&A chatbot.
 * Addresses the "assistant" and "interactive" requirements from the problem statement.
 * Integrates Firebase Analytics for interaction tracking.
 *
 * @module ChatAssistant
 * @version 2.0.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAssistant } from '../electiq.js';
import { CHAT_QUICK_ACTIONS } from '../constants.js';
import { trackChatInteraction } from '../firebase.js';

/**
 * ChatAssistant provides a full-featured conversational interface
 * for users to ask questions about the election process.
 * Features: auto-scroll, follow-up suggestions, typing indicators,
 * avatars, timestamps, and Firebase Analytics tracking.
 *
 * @returns {JSX.Element} The rendered chat component
 */
export default function ChatAssistant() {
  /** @type {[Array<object>, Function]} Chat message history */
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Welcome to ElectIQ! 🗳️ I\'m your AI election assistant. Ask me anything about the election process — from voter registration to results declaration. I\'m here to make democracy easy to understand!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUpQuestions: CHAT_QUICK_ACTIONS,
    },
  ]);
  /** @type {[string, Function]} Current input field value */
  const [input, setInput] = useState('');
  /** @type {[boolean, Function]} Loading state for AI response */
  const [loading, setLoading] = useState(false);
  /** @type {React.RefObject<HTMLDivElement>} Ref for auto-scrolling to latest message */
  const messagesEndRef = useRef(null);

  /** Auto-scroll to the latest message when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends a message to the Gemini-powered election chatbot.
   * Handles optimistic UI updates, error recovery, and analytics.
   *
   * @param {string} [text] - Optional text to send (overrides input field)
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { role: 'user', text: userMsg, time: timestamp }]);
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
      trackChatInteraction(data.category);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Sorry, I encountered an error: ${err.message}. Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input]);

  /**
   * Handles form submission for the chat input.
   * @param {React.FormEvent} e - The form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <article className="card" aria-labelledby="chat-title">
      <div className="card__header">
        <h2 className="card__title" id="chat-title">💬 Election Assistant</h2>
        <span className="card__badge card__badge--ai">GEMINI AI</span>
      </div>

      <div className="chat">
        <div className="chat__messages" role="log" aria-live="polite" aria-label="Chat conversation with AI election assistant">
          {messages.map((msg, i) => (
            <div key={i} className={`chat__msg-wrapper chat__msg-wrapper--${msg.role}`}>
              {msg.role === 'ai' && <div className="chat__avatar chat__avatar--ai" aria-hidden="true">E</div>}
              <div className={`chat__msg chat__msg--${msg.role}`}>
                <p>{msg.text}</p>
                {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="chat__follow-ups" role="group" aria-label="Suggested follow-up questions">
                    {msg.followUpQuestions.map((q, j) => (
                      <button
                        key={j}
                        className="chat__follow-btn"
                        onClick={() => sendMessage(q)}
                        aria-label={`Ask: ${q}`}
                        type="button"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div className="chat__time" aria-label={`Sent at ${msg.time}`}>{msg.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat__msg-wrapper chat__msg-wrapper--ai">
              <div className="chat__avatar chat__avatar--ai" aria-hidden="true">E</div>
              <div className="chat__msg chat__msg--ai" aria-busy="true">
                <div className="chat__typing" role="status" aria-label="ElectIQ is thinking">
                  <span className="dot" aria-hidden="true"></span>
                  <span className="dot" aria-hidden="true"></span>
                  <span className="dot" aria-hidden="true"></span>
                </div>
                <span className="sr-only">ElectIQ is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat__form" onSubmit={handleSubmit} aria-label="Send a message to the election assistant">
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
            aria-describedby="chat-hint"
          />
          <span id="chat-hint" className="sr-only">Type your question and press Enter or click Send</span>
          <button
            className="chat__send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? '...' : '→'}
          </button>
        </form>
      </div>
    </article>
  );
}
