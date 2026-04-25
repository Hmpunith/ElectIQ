import React from 'react';

/**
 * Header component with branding, live status, and semantic heading.
 * @returns {JSX.Element}
 */
export default function Header() {
  return (
    <header className="header" role="banner">
      <div className="header__brand">
        <div className="header__logo" aria-hidden="true">🗳️</div>
        <div>
          <h1 className="header__title">ElectIQ</h1>
          <div className="header__subtitle">AI Election Assistant</div>
        </div>
      </div>
      <div className="header__status" role="status" aria-live="polite" aria-label="Service status: online">
        <span className="header__status-dot" aria-hidden="true"></span>
        GEMINI LIVE
      </div>
    </header>
  );
}
