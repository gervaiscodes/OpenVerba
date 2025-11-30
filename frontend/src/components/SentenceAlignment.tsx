import { useState, useRef, useEffect } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { STEP_CONFIG } from "../config/alignment";
import type { AlignmentSentence } from "../types/alignment";
import { ClozeWord } from "./ClozeWord";
import { PlayIcon } from "./icons/PlayIcon";

export function SentenceAlignment({
  sentence,
  showTarget,
  isActive,
  onPlayEnd,
  step,
}: {
  sentence: AlignmentSentence;
  showTarget: boolean;
  isActive?: boolean;
  onPlayEnd?: () => void;
  step: number;
}) {
  const [hoveredOrder, setHoveredOrder] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playbackRate } = useAudioSettings();

  const config = STEP_CONFIG[step];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    if (wordAudioRef.current) {
      wordAudioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (isActive) {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (config.autoPlay) {
        playAudio();
      } else if (onPlayEnd) {
        onPlayEnd();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive, config.autoPlay]);

  function playAudio() {
    if (!sentence.audio_url || !config.showAudioBtn) {
      if (isActive && onPlayEnd) onPlayEnd();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(true);
    const audio = new Audio(`${API_BASE_URL}${sentence.audio_url}`);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      if (isActive && onPlayEnd) onPlayEnd();
    };

    audio.play().catch((e) => {
      console.error("Failed to play audio:", e);
      setIsPlaying(false);
      if (isActive && onPlayEnd) onPlayEnd();
    });
  }

  function playWordAudio(url: string) {
    const audio = new Audio(`${API_BASE_URL}${url}`);
    audio.playbackRate = playbackRate;
    wordAudioRef.current = audio;
    audio.play().catch((e) => console.error("Failed to play word audio:", e));
  }

  return (
    <div
      ref={containerRef}
      className={`sentence${isActive ? " active" : ""}`}
    >
      {config.showTokens && (
        <div className="tokens">
          {sentence.items
            .sort((a, b) => a.order - b.order)
            .map((it, idx) => (
              <div
                key={`pair-${it.order}`}
                className={`token${
                  hoveredOrder === it.order ? " highlight" : ""
                }`}
              >
                <div className="src">{it.target}</div>
                <div className={`tgt${idx === 0 ? " first-word" : ""}${it.occurrence_count === 1 ? " new-word" : ""}`}>
                  {it.source}
                </div>
              </div>
            ))}
        </div>
      )}
      <div
        className="sentence-text relative"
        style={config.containerStyle}
      >
        {sentence.audio_url && config.showAudioBtn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              playAudio();
            }}
            className={`play-button${isPlaying ? " playing" : ""}`}
            title="Play audio"
            style={config.audioBtnStyle}
          >
            <PlayIcon />
          </button>
        )}

        {config.showSource && (
          <div className="text-source">
            {sentence.items
              .sort((a, b) => a.order - b.order)
              .map((it, idx) => (
                <span
                  key={`s-${it.order}`}
                  className={`srcw${idx === 0 ? " first-word" : ""}${
                    hoveredOrder === it.order ? " highlight" : ""
                  }`}
                  style={{
                    cursor: config.allowWordClick ? "pointer" : "default",
                  }}
                  onMouseEnter={() => setHoveredOrder(it.order)}
                  onMouseLeave={() => setHoveredOrder(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (config.allowWordClick && it.audio_url) playWordAudio(it.audio_url);
                  }}
                  title={
                    config.allowWordClick && it.audio_url ? "Click to listen" : undefined
                  }
                >
                  {idx > 0 && !/^[.,!?;:]/.test(it.source) ? " " : ""}
                  {step === 5 ? <ClozeWord word={it.source} /> : it.source}
                </span>
              ))}
          </div>
        )}

        {(config.showTarget === true || (config.showTarget === "conditional" && showTarget)) && (
          <div
            className="text-target"
            style={config.targetStyle}
          >
            {sentence.items
              .sort((a, b) => a.order - b.order)
              .map((it, idx) => (
                <span
                  key={`t-${it.order}`}
                  style={{
                    textDecoration: step === 1 && (it.occurrence_count || 0) === 1 ? "underline dotted" : "none",
                    textUnderlineOffset: "4px",
                    textDecorationColor: "var(--muted-foreground)"
                  }}
                >
                  {idx > 0 && !/^[.,!?;:]/.test(it.target) ? " " : ""}
                  {it.target}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
