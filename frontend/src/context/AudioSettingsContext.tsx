import { createContext, useContext, useState, type ReactNode } from 'react';

type AudioSettingsContextType = {
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextType | undefined>(undefined);

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [playbackRate, setPlaybackRate] = useState(1.0);

  return (
    <AudioSettingsContext.Provider value={{ playbackRate, setPlaybackRate }}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);
  if (context === undefined) {
    throw new Error('useAudioSettings must be used within an AudioSettingsProvider');
  }
  return context;
}
