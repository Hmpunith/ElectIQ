/**
 * @fileoverview React Error Boundary component for graceful error handling.
 * Prevents unhandled exceptions from crashing the entire application.
 * Improves both code quality and accessibility by providing a fallback UI.
 *
 * @module ErrorBoundary
 * @version 1.0.0
 */

import React from 'react';

/**
 * Error Boundary class component that catches JavaScript errors
 * in the component tree and displays a fallback UI.
 *
 * @extends {React.Component}
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    /** @type {{ hasError: boolean, error: Error|null }} */
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state when an error is caught during rendering.
   * @param {Error} error - The error that was thrown
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs error details for debugging and monitoring.
   * @param {Error} error - The error that was thrown
   * @param {object} errorInfo - React error info with component stack trace
   */
  componentDidCatch(error, errorInfo) {
    console.error('[ElectIQ ErrorBoundary]', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '16px',
            margin: '2rem auto',
            maxWidth: '500px',
          }}
        >
          <h2 style={{ color: '#f43f5e', marginBottom: '0.5rem' }}>⚠️ Something went wrong</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            We encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            aria-label="Reload page"
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: '#f43f5e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
