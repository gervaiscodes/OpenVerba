import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Text from './Text';
import { AudioSettingsProvider } from '../context/AudioSettingsContext';
import { CoinProvider } from '../context/CoinContext';
import { StreakProvider } from '../context/StreakContext';

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
  source_language: 'en',
  target_language: 'pl',
  original_text: 'Witaj świecie',
  sentences: [
    {
      id: 1,
      source_sentence: 'Hello world',
      target_sentence: 'Witaj świecie',
      audio_url: '/audio/test.mp3',
      items: [
        { order: 1, source: 'Hello', target: 'Witaj', audio_url: '/audio/witaj.mp3' },
        { order: 2, source: 'world', target: 'świecie', audio_url: '/audio/swiecie.mp3' },
      ],
    },
  ],
};

// Mock API response that matches the actual backend response format
const mockTextData = {
  id: 1,
  text: 'Witaj świecie',
  source_language: 'en',
  target_language: 'pl',
  translation_data: JSON.stringify(mockTranslationData), // Backend returns this as a JSON string
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('Text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for all endpoints
    globalThis.fetch = vi.fn((url: string) => {
      // Mock CoinProvider's total completions fetch
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ total: 10 }),
        });
      }
      // Mock StreakProvider's streak fetch
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ streak: 5 }),
        });
      }
      // Default: return pending promise (tests will override as needed)
      return new Promise(() => {});
    }) as any;
  });

  const renderWithRouter = (textId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/texts/${textId}`]}>
        <CoinProvider>
          <StreakProvider>
            <AudioSettingsProvider>
              <Routes>
                <Route path="/texts/:id" element={<Text />} />
              </Routes>
            </AudioSettingsProvider>
          </StreakProvider>
        </CoinProvider>
      </MemoryRouter>
    );
  };

  it('renders nothing while loading', () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return new Promise(() => {}); // Pending promise for text data
    });

    renderWithRouter();

    // Component shows skeleton while loading
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('fetches and displays text data', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTextData,
      });
    });

    renderWithRouter();

    // Step 1 shows target sentence (Polish - learning language) by default
    await waitFor(() => {
      expect(screen.getByText('Witaj świecie')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/texts/1'),
      expect.objectContaining({
        credentials: 'include'
      })
    );
  });

  it('displays language names in breadcrumb', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTextData,
      });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Polish')).toBeInTheDocument();
    });

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.reject(new Error('Failed to load alignment'));
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load alignment/)).toBeInTheDocument();
    });
  });

  it('renders step navigation buttons', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTextData,
      });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByText(/English/)).toHaveLength(2); // Breadcrumb and step button
    });

    // Should have step buttons with language names
    expect(screen.getAllByText(/Polish/)).toHaveLength(2); // Breadcrumb and step button
  });

  it('handles non-ok response from API', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load alignment/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return new Promise(() => {}); // Pending promise for text data
    });

    renderWithRouter();

    expect(document.querySelector('.skeleton')).toBeInTheDocument();
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
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/completions/total')) {
        return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
      }
      if (url.includes('/api/completions/streak')) {
        return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTextData,
      });
    });

    renderWithRouter();

    // Wait for content to load (step 1 shows target sentence - Polish)
    await waitFor(() => {
      expect(screen.getByText('Witaj świecie')).toBeInTheDocument();
    });

    // Should show delete button
    const deleteButton = screen.getByText('Delete Text');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Step Completion', () => {
    it('fetches completed steps on mount', async () => {
      let fetchCallCount = 0;
      (globalThis.fetch as any).mockImplementation((url: string) => {
        fetchCallCount++;
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [1, 2] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(fetchCallCount).toBeGreaterThanOrEqual(2); // Text data + completions
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/texts/1/step-completions'),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });

    it('displays checkmarks on completed steps', async () => {
      (globalThis.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [1, 3, 5] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Witaj świecie')).toBeInTheDocument();
      });

      // Check for SVG checkmarks (they have a specific path)
      const checkmarks = document.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');
      expect(checkmarks.length).toBe(3); // Steps 1, 3, and 5
    });

    it('displays Mark Complete button', async () => {
      (globalThis.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Mark Step 1 as Complete')).toBeInTheDocument();
      });
    });

    it('marks step as complete and navigates to next step', async () => {
      let completedSteps: number[] = [];
      (globalThis.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/text-step-completions') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          completedSteps.push(body.step_number);
          return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: completedSteps }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Mark Step 1 as Complete')).toBeInTheDocument();
      });

      const markCompleteButton = screen.getByText('Mark Step 1 as Complete');
      fireEvent.click(markCompleteButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/text-step-completions'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"step_number":1'),
          })
        );
      });
    });

    it('shows already completed message for completed steps', async () => {
      (globalThis.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [1] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Step 1 Already Completed ✓')).toBeInTheDocument();
      });
    });

    it('displays reset button when completions exist', async () => {
      (globalThis.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [1, 2] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Reset All Completions')).toBeInTheDocument();
      });
    });

    it('resets all completions when reset button clicked', async () => {
      let completedSteps = [1, 2, 3];
      (globalThis.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/step-completions') && options?.method === 'DELETE') {
          completedSteps = [];
          return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: completedSteps }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Reset All Completions')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset All Completions');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/texts/1/step-completions'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('navigates to homepage when completing step 6', async () => {
      (globalThis.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/text-step-completions') && options?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [1, 2, 3, 4, 5] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Witaj świecie')).toBeInTheDocument();
      });

      // Click to step 6
      const step6Button = screen.getByText('6. Speak');
      fireEvent.click(step6Button);

      await waitFor(() => {
        expect(screen.getByText('Mark Step 6 as Complete')).toBeInTheDocument();
      });

      const markCompleteButton = screen.getByText('Mark Step 6 as Complete');
      fireEvent.click(markCompleteButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles completion API errors gracefully', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      (globalThis.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/completions/total')) {
          return Promise.resolve({ ok: true, json: async () => ({ total: 10 }) });
        }
        if (url.includes('/api/completions/streak')) {
          return Promise.resolve({ ok: true, json: async () => ({ streak: 5 }) });
        }
        if (url.includes('/text-step-completions') && options?.method === 'POST') {
          return Promise.resolve({ ok: false });
        }
        if (url.includes('/step-completions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed_steps: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTextData,
        });
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Mark Step 1 as Complete')).toBeInTheDocument();
      });

      const markCompleteButton = screen.getByText('Mark Step 1 as Complete');
      fireEvent.click(markCompleteButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to mark step complete. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });
});
