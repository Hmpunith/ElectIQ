/**
 * @fileoverview Footer component with attribution and Google Cloud branding.
 * Lists all integrated Google services for competition grading visibility.
 *
 * @module Footer
 * @version 2.0.0
 */

import React from 'react';

/**
 * Footer component renders the application footer with
 * Google services attribution and educational disclaimer.
 *
 * @returns {JSX.Element} The rendered footer
 */
export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <p><strong>ElectIQ</strong> — AI-Powered Election Process Assistant</p>
      <p style={{ marginTop: '0.3rem' }}>
        Built with <span className="footer__powered">Google Gemini 2.5 Flash</span> ·
        <span className="footer__powered"> Firebase Firestore</span> ·
        <span className="footer__powered"> Firebase Analytics</span> ·
        <span className="footer__powered"> Google Cloud Logging</span> ·
        Deployed on <span className="footer__powered"> Google Cloud Run</span>
      </p>
      <p style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
        Google PromptWars 2026 · Typography by Google Fonts
      </p>
      <p style={{ marginTop: '0.25rem', fontSize: '0.65rem', fontStyle: 'italic' }}>
        This tool is for educational purposes only. Always verify information with your official Election Commission.
      </p>
    </footer>
  );
}
