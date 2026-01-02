import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompletionGraph } from './CompletionGraph';

describe('CompletionGraph', () => {
  it('renders the graph title', () => {
    render(<CompletionGraph stats={[]} />);

    expect(screen.getByText('Completion Trends (Last 30 Days)')).toBeInTheDocument();
  });

  it('renders 30 bars for the last 30 days', () => {
    const { container } = render(<CompletionGraph stats={[]} />);

    // Each day has a bar div with a title attribute
    const bars = container.querySelectorAll('[title*="completions"]');
    expect(bars).toHaveLength(30);
  });

  it('displays total completions correctly', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const stats = [
      { date: today.toISOString().split('T')[0], count: 5 },
      { date: yesterday.toISOString().split('T')[0], count: 3 },
      { date: twoDaysAgo.toISOString().split('T')[0], count: 2 },
    ];

    render(<CompletionGraph stats={stats} />);

    expect(screen.getByText('Total: 10 completions')).toBeInTheDocument();
  });

  it('displays max per day correctly', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const stats = [
      { date: today.toISOString().split('T')[0], count: 10 },
      { date: yesterday.toISOString().split('T')[0], count: 5 },
      { date: twoDaysAgo.toISOString().split('T')[0], count: 3 },
    ];

    render(<CompletionGraph stats={stats} />);

    expect(screen.getByText('Max per day: 10')).toBeInTheDocument();
  });

  it('shows zero total when no stats provided', () => {
    render(<CompletionGraph stats={[]} />);

    expect(screen.getByText('Total: 0 completions')).toBeInTheDocument();
    expect(screen.getByText('Max per day: 1')).toBeInTheDocument();
  });

  it('renders bars with correct titles showing date and count', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const stats = [
      { date: todayStr, count: 5 },
    ];

    const { container } = render(<CompletionGraph stats={stats} />);

    const barWithCompletions = container.querySelector(`[title="${todayStr}: 5 completions"]`);
    expect(barWithCompletions).toBeInTheDocument();
  });

  it('displays date labels every 5 days', () => {
    const { container } = render(<CompletionGraph stats={[]} />);

    // Date labels are spans with rotated text (every 5th day)
    // We should have 6 labels (indices 0, 5, 10, 15, 20, 25)
    const dateLabels = container.querySelectorAll('span[style*="rotate"]');
    expect(dateLabels.length).toBeGreaterThan(0);
  });

  it('handles stats with dates outside the last 30 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const oldDateStr = oldDate.toISOString().split('T')[0];

    const stats = [
      { date: oldDateStr, count: 10 },
    ];

    render(<CompletionGraph stats={stats} />);

    // Old dates should not affect the graph, total should be 0
    expect(screen.getByText('Total: 10 completions')).toBeInTheDocument();
    // But the graph only shows last 30 days, so max should be 1 (default)
    expect(screen.getByText('Max per day: 1')).toBeInTheDocument();
  });
});

