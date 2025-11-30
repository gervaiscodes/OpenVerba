import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StreakCounter } from './StreakCounter';

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

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
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as any;

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders streak count when streak is fetched', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ streak: 5 }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('shows active streak styling when streak > 0', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ streak: 3 }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    await waitFor(() => {
      const flame = document.querySelector('.streak-flame.active');
      expect(flame).toBeInTheDocument();
      expect(flame).toHaveTextContent('🔥');
    });

    const counter = screen.getByTitle('3 day streak!');
    expect(counter).toBeInTheDocument();
  });

  it('shows inactive streak styling when streak is 0', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ streak: 0 }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    await waitFor(() => {
      const flame = document.querySelector('.streak-flame');
      expect(flame).toBeInTheDocument();
      expect(flame).toHaveTextContent('🔥');
      expect(flame).not.toHaveClass('active');
    });

    const counter = screen.getByTitle('No active streak');
    expect(counter).toBeInTheDocument();
  });

  it('navigates to /stats when clicked', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ streak: 2 }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    const counter = screen.getByTitle('2 day streak!');
    fireEvent.click(counter);

    expect(mockNavigate).toHaveBeenCalledWith('/stats');
  });

  it('fetches streak from correct API endpoint', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ streak: 1 }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/completions/streak'
      );
    });
  });

  it('handles fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    const { container } = render(
      <MemoryRouter>
        <StreakCounter />
      </MemoryRouter>
    );

    // Should remain null (not render) when fetch fails
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch streak:',
        expect.any(Error)
      );
    });

    expect(container.firstChild).toBeNull();
    consoleErrorSpy.mockRestore();
  });
});

