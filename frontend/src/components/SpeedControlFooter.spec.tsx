import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeedControlFooter from './SpeedControlFooter';
import { AudioSettingsProvider } from '../context/AudioSettingsContext';

describe('SpeedControlFooter', () => {
  it('renders all playback rate options', () => {
    render(
      <AudioSettingsProvider>
        <SpeedControlFooter />
      </AudioSettingsProvider>
    );

    expect(screen.getByText('Audio Speed:')).toBeInTheDocument();
    expect(screen.getByText('0.75x')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
  });

  it('allows changing playback rate', () => {
    render(
      <AudioSettingsProvider>
        <SpeedControlFooter />
      </AudioSettingsProvider>
    );

    const button = screen.getByText('1.5x');
    fireEvent.click(button);

    // The button should now have the active class
    expect(button).toHaveClass('badge-alt');
  });
});
