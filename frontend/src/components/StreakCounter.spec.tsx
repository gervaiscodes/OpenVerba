import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StreakCounter } from './StreakCounter';
import * as StreakContext from '../context/StreakContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StreakCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('returns null when streak is null (loading state)', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: null,
      refreshStreak: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders streak count when streak is available', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: 5,
      refreshStreak: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    // Check for the FlameIcon SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows active streak styling when streak > 0', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: 3,
      refreshStreak: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    // Check for the FlameIcon SVG with active styling (orange color)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-orange-500');

    const counter = screen.getByTitle('3 day streak!');
    expect(counter).toBeInTheDocument();
  });

  it('shows inactive streak styling when streak is 0', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: 0,
      refreshStreak: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    // Check for the FlameIcon SVG with inactive styling (zinc-600 color)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-zinc-600');
    expect(svg).not.toHaveClass('text-orange-500');

    const counter = screen.getByTitle('No active streak');
    expect(counter).toBeInTheDocument();
  });
});
