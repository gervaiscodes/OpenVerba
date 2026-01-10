import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Texts from './Texts';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Texts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as any;

    render(
      <BrowserRouter>
        <Texts />
      </BrowserRouter>
    );

    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('displays texts when loaded successfully', async () => {
    const mockTexts = [
      {
        id: 1,
        text: 'Hello world',
        source_language: 'fr',
        target_language: 'en',
        created_at: '2025-11-23T12:00:00Z',
      },
      {
        id: 2,
        text: 'Test text',
        source_language: 'en',
        target_language: 'pl',
        created_at: '2025-11-23T13:00:00Z',
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTexts),
      })
    ) as any;

    render(
      <BrowserRouter>
        <Texts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Test text')).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as any;

    render(
      <BrowserRouter>
        <Texts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('displays empty state when no texts are available', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;

    render(
      <BrowserRouter>
        <Texts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No texts found.')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar for each text', async () => {
      const mockTexts = [
        {
          id: 1,
          text: 'Hello world',
          source_language: 'fr',
          target_language: 'en',
          created_at: '2025-11-23T12:00:00Z',
          completed_steps: 3,
        },
        {
          id: 2,
          text: 'Test text',
          source_language: 'en',
          target_language: 'pl',
          created_at: '2025-11-23T13:00:00Z',
          completed_steps: 0,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTexts),
        })
      ) as any;

      render(
        <BrowserRouter>
          <Texts />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('3/6 steps')).toBeInTheDocument();
        expect(screen.getByText('0/6 steps')).toBeInTheDocument();
      });
    });

    it('displays correct progress percentage for each text', async () => {
      const mockTexts = [
        {
          id: 1,
          text: 'Half complete',
          source_language: 'fr',
          target_language: 'en',
          created_at: '2025-11-23T12:00:00Z',
          completed_steps: 3,
        },
        {
          id: 2,
          text: 'Fully complete',
          source_language: 'en',
          target_language: 'pl',
          created_at: '2025-11-23T13:00:00Z',
          completed_steps: 6,
        },
        {
          id: 3,
          text: 'Not started',
          source_language: 'en',
          target_language: 'de',
          created_at: '2025-11-23T14:00:00Z',
          completed_steps: 0,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTexts),
        })
      ) as any;

      render(
        <BrowserRouter>
          <Texts />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Half complete')).toBeInTheDocument();
      });

      // Find all progress bars (divs with emerald background)
      const progressBars = document.querySelectorAll('.bg-emerald-600');

      // Check that we have 3 progress bars (one per text)
      expect(progressBars.length).toBe(3);

      // Check widths (50%, 100%, 0%)
      expect(progressBars[0]).toHaveStyle({ width: '50%' });
      expect(progressBars[1]).toHaveStyle({ width: '100%' });
      expect(progressBars[2]).toHaveStyle({ width: '0%' });
    });

    it('displays all step counts correctly', async () => {
      const mockTexts = [
        {
          id: 1,
          text: 'One step',
          source_language: 'fr',
          target_language: 'en',
          created_at: '2025-11-23T12:00:00Z',
          completed_steps: 1,
        },
        {
          id: 2,
          text: 'Two steps',
          source_language: 'en',
          target_language: 'pl',
          created_at: '2025-11-23T13:00:00Z',
          completed_steps: 2,
        },
        {
          id: 3,
          text: 'Five steps',
          source_language: 'en',
          target_language: 'de',
          created_at: '2025-11-23T14:00:00Z',
          completed_steps: 5,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTexts),
        })
      ) as any;

      render(
        <BrowserRouter>
          <Texts />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('1/6 steps')).toBeInTheDocument();
        expect(screen.getByText('2/6 steps')).toBeInTheDocument();
        expect(screen.getByText('5/6 steps')).toBeInTheDocument();
      });
    });

    it('handles texts with no completed_steps field gracefully', async () => {
      const mockTexts = [
        {
          id: 1,
          text: 'Old text without progress',
          source_language: 'fr',
          target_language: 'en',
          created_at: '2025-11-23T12:00:00Z',
          // No completed_steps field
        } as any,
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTexts),
        })
      ) as any;

      render(
        <BrowserRouter>
          <Texts />
        </BrowserRouter>
      );

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('Old text without progress')).toBeInTheDocument();
      });
    });
  });
});
