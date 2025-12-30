import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Words from './Words';

vi.mock('../context/AudioSettingsContext', () => ({
  useAudioSettings: () => ({ playbackRate: 1.0 }),
}));

vi.mock('../utils/languages', () => ({
  getLanguageName: (code: string) => {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
    };
    return names[code] || code;
  },
}));

describe('Words', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as any;

    render(<Words />);

    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch words'))
    ) as any;

    render(<Words />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch words/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no words are available', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as any;

    render(<Words />);

    await waitFor(() => {
      expect(screen.getByText('No words found yet.')).toBeInTheDocument();
    });
  });

  it('renders words grouped by language', async () => {
    const mockData = {
      en: [
        {
          id: 1,
          source_word: 'hello',
          target_word: 'hola',
          source_language: 'en',
          occurrence_count: 5,
          completion_count: 2,
          audio_url: '/audio/hello.mp3',
        },
        {
          id: 2,
          source_word: 'world',
          target_word: 'mundo',
          source_language: 'en',
          occurrence_count: 3,
          completion_count: 0,
        },
      ],
      fr: [
        {
          id: 3,
          source_word: 'bonjour',
          target_word: 'salut',
          source_language: 'fr',
          occurrence_count: 2,
          completion_count: 0,
        },
      ],
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    ) as any;

    render(<Words />);

    await waitFor(() => {
      expect(screen.getByText('Words')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.getByText('hola')).toBeInTheDocument();
      expect(screen.getByText('world')).toBeInTheDocument();
      expect(screen.getByText('mundo')).toBeInTheDocument();
      expect(screen.getByText('bonjour')).toBeInTheDocument();
      expect(screen.getByText('salut')).toBeInTheDocument();
      expect(screen.getByText('5 appearances')).toBeInTheDocument();
      expect(screen.getByText('3 appearances')).toBeInTheDocument();
      expect(screen.getByText('2 appearances')).toBeInTheDocument();
    });
  });

  it('displays singular "appearance" for occurrence_count of 1', async () => {
    const mockData = {
      en: [
        {
          id: 1,
          source_word: 'rare',
          target_word: 'raro',
          source_language: 'en',
          occurrence_count: 1,
          completion_count: 0,
        },
      ],
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    ) as any;

    render(<Words />);

    await waitFor(() => {
      expect(screen.getByText('1 appearance')).toBeInTheDocument();
    });
  });
});
