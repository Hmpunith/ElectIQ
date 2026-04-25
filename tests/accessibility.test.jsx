/**
 * @fileoverview Accessibility-focused tests.
 * Validates WCAG compliance across all components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('Accessibility Compliance', () => {
  it('should have a single h1 heading', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('ElectIQ');
  });

  it('should have a skip link pointing to #main-content', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink.tagName).toBe('A');
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have a main landmark with id matching skip link target', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('should have a banner landmark (header)', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should have a contentinfo landmark (footer)', () => {
    render(<App />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should have a navigation tablist with proper ARIA', () => {
    render(<App />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label');
    expect(tablist.tagName).toBe('NAV');
  });

  it('should have exactly one tab marked as selected', () => {
    render(<App />);
    const selectedTabs = screen.getAllByRole('tab').filter(
      (tab) => tab.getAttribute('aria-selected') === 'true'
    );
    expect(selectedTabs).toHaveLength(1);
  });

  it('should have a tabpanel linked to the active tab', () => {
    render(<App />);
    const activeTab = screen.getAllByRole('tab').find(
      (tab) => tab.getAttribute('aria-selected') === 'true'
    );
    const panelId = activeTab.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    expect(panel).toBeInTheDocument();
    expect(panel.getAttribute('role')).toBe('tabpanel');
  });

  it('should have a live status region for Gemini status', () => {
    render(<App />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
