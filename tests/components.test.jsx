import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Timeline from '../src/components/Timeline';
import ElectionStepper from '../src/components/ElectionStepper';
import ElectionQuiz from '../src/components/ElectionQuiz';
import App from '../src/App';

describe('Header Component', () => {
  it('should render semantic heading and live status', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('ElectIQ')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('GEMINI LIVE');
  });
});

describe('Footer Component', () => {
  it('should render Google attribution', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini/i)).toBeInTheDocument();
  });
});

describe('Timeline Component', () => {
  it('should render all 10 timeline events', () => {
    render(<Timeline />);
    expect(screen.getByText('Election Announcement')).toBeInTheDocument();
    expect(screen.getByText('Results Declaration')).toBeInTheDocument();
    expect(screen.getByText('Government Formation')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(10);
  });
});

describe('ElectionStepper Component', () => {
  it('should render all 6 election steps', () => {
    render(<ElectionStepper />);
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Results Declaration')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(6);
  });

  it('should have clickable steps with keyboard support', () => {
    render(<ElectionStepper />);
    const steps = screen.getAllByRole('listitem');
    steps.forEach(step => expect(step).toHaveAttribute('tabIndex', '0'));
  });
});

describe('ElectionQuiz Component', () => {
  it('should render quiz topic selection grid', () => {
    render(<ElectionQuiz />);
    expect(screen.getByText(/Voter Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Voting Day Process/i)).toBeInTheDocument();
  });
});

describe('App Component', () => {
  it('should render tab navigation with all 4 tabs', () => {
    render(<App />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('should render skip link for accessibility', () => {
    render(<App />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('should show Steps panel by default', () => {
    render(<App />);
    expect(screen.getByText(/Election Process Steps/i)).toBeInTheDocument();
  });
});
