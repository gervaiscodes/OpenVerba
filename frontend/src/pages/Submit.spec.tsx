import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Submit from './Submit';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Submit', () => {
  it('renders the form with all required fields', () => {
    render(
      <BrowserRouter>
        <Submit />
      </BrowserRouter>
    );

    expect(screen.getByText('New translation')).toBeInTheDocument();
    expect(screen.getByLabelText('Source language')).toBeInTheDocument();
    expect(screen.getByLabelText('Target language')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to translate...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate Text' })).toBeInTheDocument();
  });

  it('allows switching between manual and generate modes', () => {
    render(
      <BrowserRouter>
        <Submit />
      </BrowserRouter>
    );

    const toggleButton = screen.getByText('✨ Generate with AI');
    fireEvent.click(toggleButton);

    expect(screen.getByText('New words percentage')).toBeInTheDocument();
    expect(screen.getByText('Generate Text with AI')).toBeInTheDocument();
  });

  it('disables submit button when text is empty', () => {
    render(
      <BrowserRouter>
        <Submit />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: 'Translate Text' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when text is entered', () => {
    render(
      <BrowserRouter>
        <Submit />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Enter text to translate...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    const submitButton = screen.getByRole('button', { name: 'Translate Text' });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits the form and navigates on success', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 123 }),
      })
    ) as any;

    render(
      <BrowserRouter>
        <Submit />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Enter text to translate...');
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const submitButton = screen.getByRole('button', { name: 'Translate Text' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/texts/123');
    });
  });
});
