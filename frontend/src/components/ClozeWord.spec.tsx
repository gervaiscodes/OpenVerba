import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClozeWord } from './ClozeWord';

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

vi.mock('./Firework', () => ({
  Firework: () => <div data-testid="firework">🎆</div>,
}));

vi.mock('../context/CoinContext', () => ({
  useCoin: () => ({
    increment: vi.fn(),
  }),
}));

describe('ClozeWord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as any;
  });

  it('renders a normal word with first letter visible and input field', () => {
    render(<ClozeWord word="hello" />);

    expect(screen.getByText('h')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('shows short words (1 character) as-is without input', () => {
    render(<ClozeWord word="a" />);

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows punctuation as-is without input', () => {
    render(<ClozeWord word="." />);
    expect(screen.getByText('.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    render(<ClozeWord word="," />);
    expect(screen.getByText(',')).toBeInTheDocument();
  });

  it('validates correct input and shows success styling', async () => {
    render(<ClozeWord word="hello" wordId={1} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ello' } });

    // Check that input shows correct styling (green color)
    expect(input).toHaveValue('ello');
    // The first letter should turn green when correct
    const firstLetter = screen.getByText('h');
    expect(firstLetter).toHaveStyle({ color: '#4ade80' });
  });

  it('validates incorrect input and shows error styling', async () => {
    render(<ClozeWord word="hello" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'wrong' } });

    expect(input).toHaveValue('wrong');
    // The first letter should turn red when there's an error
    const firstLetter = screen.getByText('h');
    expect(firstLetter).toHaveStyle({ color: '#ef4444' });
  });

  it('makes API call when word is completed correctly with wordId', async () => {
    render(<ClozeWord word="hello" wordId={123} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ello' } });

    // Wait for the API call
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word_id: 123 }),
        })
      );
    });
  });

  it('does not make API call when wordId is not provided', async () => {
    render(<ClozeWord word="hello" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ello' } });

    // Wait a bit to ensure no API call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('shows firework animation when word is completed correctly', async () => {
    render(<ClozeWord word="hello" wordId={1} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ello' } });

    // Firework should appear
    await waitFor(() => {
      expect(screen.getByTestId('firework')).toBeInTheDocument();
    });
  });
});

