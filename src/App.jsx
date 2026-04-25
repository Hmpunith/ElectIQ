/**
 * @fileoverview Main App component for ElectIQ.
 * Manages tab navigation between the 4 core features: Steps, Timeline, Assistant, and Quiz.
 * Wraps the application in an ErrorBoundary for graceful crash handling.
 * Imports Firebase for Google services integration.
 *
 * @module App
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import ElectionStepper from './components/ElectionStepper.jsx';
import Timeline from './components/Timeline.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';
import ElectionQuiz from './components/ElectionQuiz.jsx';
import Footer from './components/Footer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { trackEvent } from './firebase.js';

/**
 * @constant {Array<object>} TABS - Navigation tab definitions.
 * Each tab maps to a core feature that addresses the problem statement.
 */
const TABS = [
  { id: 'steps', label: '📋 Steps' },
  { id: 'timeline', label: '📅 Timeline' },
  { id: 'assistant', label: '💬 Assistant' },
  { id: 'quiz', label: '🧠 Quiz' },
];

/**
 * Root application component.
 * Orchestrates tab-based navigation between election education features
 * and integrates Firebase for analytics tracking.
 *
 * @returns {JSX.Element} The rendered application
 */
export default function App() {
  /** @type {[string, Function]} Currently active tab ID */
  const [activeTab, setActiveTab] = useState('steps');

  /**
   * Handles tab selection and tracks the navigation event in Firebase Analytics.
   * @param {string} tabId - The ID of the selected tab
   */
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    trackEvent('tab_changed', { tab: tabId });
  }, []);

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="app" lang="en">
        <Header />

        <main id="main-content" role="main" aria-label="ElectIQ Election Guide">
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
                onClick={() => handleTabChange(tab.id)}
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
    </ErrorBoundary>
  );
}
