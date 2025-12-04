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

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('shows active streak styling when streak > 0', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: 3,
      refreshStreak: vi.fn(),
    });

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    const flame = document.querySelector('.streak-flame.active');
    expect(flame).toBeInTheDocument();
    expect(flame).toHaveTextContent('🔥');

    const counter = screen.getByTitle('3 day streak!');
    expect(counter).toBeInTheDocument();
  });

  it('shows inactive streak styling when streak is 0', () => {
    vi.spyOn(StreakContext, 'useStreak').mockReturnValue({
      streak: 0,
      refreshStreak: vi.fn(),
    });

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    const flame = document.querySelector('.streak-flame');
    expect(flame).toBeInTheDocument();
    expect(flame).toHaveTextContent('🔥');
    expect(flame).not.toHaveClass('active');

    const counter = screen.getByTitle('No active streak');
    expect(counter).toBeInTheDocument();
  });
});
