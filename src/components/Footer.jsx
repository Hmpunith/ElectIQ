import React from 'react';

/**
 * Footer component with attribution and Google branding.
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <p><strong>ElectIQ</strong> — AI-Powered Election Process Assistant</p>
      <p style={{ marginTop: '0.3rem' }}>
        Powered by <span className="footer__powered">Google Gemini 2.5 Flash</span> · Built for Google PromptWars 2026
      </p>
      <p style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>
        This tool is for educational purposes only. Always verify information with your official Election Commission.
      </p>
    </footer>
  );
}
