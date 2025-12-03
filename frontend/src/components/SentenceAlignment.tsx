import { useState, useRef, useEffect, useMemo } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { STEP_CONFIG } from "../config/alignment";
import type { AlignmentSentence } from "../types/alignment";
import { ClozeWord } from "./ClozeWord";
import { PronunciationPractice } from "./PronunciationPractice";
import { PlayIcon } from "./icons/PlayIcon";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { sortByOrder, needsSpaceBefore } from "../utils/text";

export function SentenceAlignment({
  sentence,
  showTarget,
  isActive,
  onPlayEnd,
  step,
  language,
}: {
  sentence: AlignmentSentence;
  showTarget: boolean;
  isActive?: boolean;
  onPlayEnd?: () => void;
  step: number;
  language: string;
}) {
  const [hoveredOrder, setHoveredOrder] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const { playbackRate } = useAudioSettings();

  const config = STEP_CONFIG[step];

  // Use custom audio hook for sentence audio
  const sentenceAudio = useAudioPlayer(
    isActive && onPlayEnd ? onPlayEnd : undefined
  );

  // Memoize sorted items to avoid re-sorting on every render
  const sortedItems = useMemo(
    () => [...sentence.items].sort(sortByOrder),
    [sentence.items]
  );

  // Sync word audio playback rate
  useEffect(() => {
    if (wordAudioRef.current) {
      wordAudioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (config.autoPlay) {
        playSentenceAudio();
      } else if (onPlayEnd) {
        onPlayEnd();
      }
    } else {
      sentenceAudio.stop();
    }
  }, [isActive, config.autoPlay]);

  function playSentenceAudio() {
    if (!sentence.audio_url || !config.showAudioBtn) {
      if (isActive && onPlayEnd) onPlayEnd();
      return;
    }
    sentenceAudio.play(sentence.audio_url);
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
          {sortedItems.map((it, idx) => (
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
              playSentenceAudio();
            }}
            className={`play-button${sentenceAudio.isPlaying ? " playing" : ""}`}
            title="Play audio"
            style={config.audioBtnStyle}
          >
            <PlayIcon />
          </button>
        )}

        {step === 6 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRecording(!isRecording);
            }}
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translate(0, -50%)',
              background: isRecording ? '#ef4444' : '#3f3f46',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '2px' }} />
            ) : (
              <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%' }} />
            )}
          </button>
        )}

        {config.showSource && (
          <div className="text-source">
            {sortedItems.map((it, idx) => (
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
                {idx > 0 && needsSpaceBefore(it.source) ? " " : ""}
                {step === 5 ? <ClozeWord word={it.source} wordId={it.id} /> : it.source}
              </span>
            ))}
          </div>
        )}

        {(config.showTarget === true || (config.showTarget === "conditional" && showTarget)) && (
          <div
            className="text-target"
            style={config.targetStyle}
          >
            {sentence.target_sentence}
          </div>
        )}

        {step === 6 && (
          <PronunciationPractice
            targetText={sentence.source_sentence}
            language={language}
            isRecording={isRecording}
          />
        )}
      </div>
    </div>
  );
}
