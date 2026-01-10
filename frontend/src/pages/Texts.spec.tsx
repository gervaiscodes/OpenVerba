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
});
