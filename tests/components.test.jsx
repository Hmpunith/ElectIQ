import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Timeline from '../src/components/Timeline';
import ElectionStepper from '../src/components/ElectionStepper';
import ElectionQuiz from '../src/components/ElectionQuiz';
import ErrorBoundary from '../src/components/ErrorBoundary';
import App from '../src/App';

/* ── Header Tests ─────────────────────────────────────────────────────────── */
describe('Header Component', () => {
  it('should render semantic banner with heading', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('ElectIQ')).toBeInTheDocument();
  });

  it('should display live Gemini status indicator', () => {
    render(<Header />);
    expect(screen.getByRole('status')).toHaveTextContent('GEMINI LIVE');
  });

  it('should have accessible status label', () => {
    render(<Header />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label');
  });
});

/* ── Footer Tests ─────────────────────────────────────────────────────────── */
describe('Footer Component', () => {
  it('should render contentinfo role with Google attribution', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini/i)).toBeInTheDocument();
  });

  it('should include educational disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/educational purposes/i)).toBeInTheDocument();
  });
});

/* ── Timeline Tests ───────────────────────────────────────────────────────── */
describe('Timeline Component', () => {
  it('should render all 10 timeline events as list items', () => {
    render(<Timeline />);
    expect(screen.getAllByRole('listitem').length).toBe(10);
  });

  it('should display first and last events', () => {
    render(<Timeline />);
    expect(screen.getByText('Election Announcement')).toBeInTheDocument();
    expect(screen.getByText('Government Formation')).toBeInTheDocument();
  });

  it('should have accessible timeline list', () => {
    render(<Timeline />);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Election timeline phases');
  });
});

/* ── ElectionStepper Tests ────────────────────────────────────────────────── */
describe('ElectionStepper Component', () => {
  it('should render all 6 election steps', () => {
    render(<ElectionStepper />);
    expect(screen.getByText(/Voter Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Results Declaration/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(6);
  });

  it('should have clickable steps with keyboard support', () => {
    render(<ElectionStepper />);
    const steps = screen.getAllByRole('listitem');
    steps.forEach(step => expect(step).toHaveAttribute('tabIndex', '0'));
  });

  it('should have aria-expanded attribute on steps', () => {
    render(<ElectionStepper />);
    const steps = screen.getAllByRole('listitem');
    steps.forEach(step => expect(step).toHaveAttribute('aria-expanded', 'false'));
  });
});

/* ── ElectionQuiz Tests ───────────────────────────────────────────────────── */
describe('ElectionQuiz Component', () => {
  it('should render quiz topic selection grid', () => {
    render(<ElectionQuiz />);
    expect(screen.getByText(/Voter Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Voting Day Process/i)).toBeInTheDocument();
  });

  it('should have accessible topic buttons', () => {
    render(<ElectionQuiz />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toHaveAttribute('aria-label'));
  });
});

/* ── ErrorBoundary Tests ──────────────────────────────────────────────────── */
describe('ErrorBoundary Component', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

/* ── App Integration Tests ────────────────────────────────────────────────── */
describe('App Component', () => {
  it('should render tab navigation with all 4 tabs', () => {
    render(<App />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('should render skip link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should show Steps panel by default', () => {
    render(<App />);
    expect(screen.getByText(/Election Process Steps/i)).toBeInTheDocument();
  });

  it('should mark first tab as selected', () => {
    render(<App />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('should have main landmark with accessible label', () => {
    render(<App />);
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'ElectIQ Election Guide');
  });
});
