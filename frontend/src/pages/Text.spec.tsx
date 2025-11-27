import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Text from './Text';
import { AudioSettingsProvider } from '../context/AudioSettingsContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock translation data structure that matches what's inside translation_data JSON
const mockTranslationData = {
  source_language: 'pl',
  target_language: 'en',
  original_text: 'Witaj świecie',
  sentences: [
    {
      id: 1,
      source_sentence: 'Witaj świecie',
      target_sentence: 'Hello world',
      audio_url: '/audio/test.mp3',
      items: [
        { order: 1, source: 'Witaj', target: 'Hello', audio_url: '/audio/witaj.mp3' },
        { order: 2, source: 'świecie', target: 'world', audio_url: '/audio/swiecie.mp3' },
      ],
    },
  ],
};

// Mock API response that matches the actual backend response format
const mockTextData = {
  id: 1,
  text: 'Witaj świecie',
  source_language: 'pl',
  target_language: 'en',
  translation_data: JSON.stringify(mockTranslationData), // Backend returns this as a JSON string
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('Text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  const renderWithRouter = (textId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/texts/${textId}`]}>
        <AudioSettingsProvider>
          <Routes>
            <Route path="/texts/:id" element={<Text />} />
          </Routes>
        </AudioSettingsProvider>
      </MemoryRouter>
    );
  };

  it('renders nothing while loading', () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => {}));

    renderWithRouter();

    // Component shows "Loading…" while loading
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('fetches and displays text data', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTextData,
    });

    renderWithRouter();

    // Step 1 shows target sentence (English) by default
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/texts/1')
    );
  });

  it('displays language names in breadcrumb', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTextData,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Polish')).toBeInTheDocument();
    });

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('Failed to load alignment'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load alignment/)).toBeInTheDocument();
    });
  });

  it('displays token usage information', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTextData,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/30/)).toBeInTheDocument();
    });
  });

  it('renders step navigation buttons', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTextData,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Read English/)).toBeInTheDocument();
    });

    // Should have step buttons with language names
    expect(screen.getByText(/Read Polish/)).toBeInTheDocument();
  });

  it('handles non-ok response from API', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load alignment/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => {}));

    renderWithRouter();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('handles missing text ID', () => {
    render(
      <MemoryRouter initialEntries={['/texts/']}>
        <AudioSettingsProvider>
          <Routes>
            <Route path="/texts/:id?" element={<Text />} />
          </Routes>
        </AudioSettingsProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText(/No text ID provided/)).toBeInTheDocument();
  });

  it('displays delete button and confirmation flow', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTextData,
    });

    renderWithRouter();

    // Wait for content to load (step 1 shows target sentence)
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    // Should show delete button
    const deleteButton = screen.getByText('Delete Text');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    deleteButton.click();

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});
