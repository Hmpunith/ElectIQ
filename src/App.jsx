import React, { useState } from 'react';
import Header from './components/Header.jsx';
import ElectionStepper from './components/ElectionStepper.jsx';
import Timeline from './components/Timeline.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';
import ElectionQuiz from './components/ElectionQuiz.jsx';
import Footer from './components/Footer.jsx';

/**
 * @fileoverview Main App component for ElectIQ.
 * Manages tab navigation between the 4 core features:
 * Steps, Timeline, Assistant, and Quiz.
 */

const TABS = [
  { id: 'steps', label: '📋 Steps', icon: '📋' },
  { id: 'timeline', label: '📅 Timeline', icon: '📅' },
  { id: 'assistant', label: '💬 Assistant', icon: '💬' },
  { id: 'quiz', label: '🧠 Quiz', icon: '🧠' },
];

/**
 * Root application component.
 * Manages tab navigation between election education features.
 * @returns {JSX.Element}
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('steps');

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="app">
        <Header />

        <main id="main-content" role="main">
          {/* ── Tab Navigation ── */}
          <nav className="tabs" role="tablist" aria-label="Election guide sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* ── Tab Panels ── */}
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'steps' && <ElectionStepper />}
            {activeTab === 'timeline' && <Timeline />}
            {activeTab === 'assistant' && <ChatAssistant />}
            {activeTab === 'quiz' && <ElectionQuiz />}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
