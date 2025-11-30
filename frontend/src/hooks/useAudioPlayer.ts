import { useState, useRef, useEffect } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";

export function useAudioPlayer(onPlayEnd?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playbackRate } = useAudioSettings();

  // Sync playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const play = (audioUrl: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(true);
    const audio = new Audio(`${API_BASE_URL}${audioUrl}`);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      if (onPlayEnd) onPlayEnd();
    };

    audio.play().catch((e) => {
      console.error("Failed to play audio:", e);
      setIsPlaying(false);
      if (onPlayEnd) onPlayEnd();
    });
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return { isPlaying, play, stop, audioRef };
}
