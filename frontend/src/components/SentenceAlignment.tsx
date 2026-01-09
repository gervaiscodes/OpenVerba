import { useState, useRef, useEffect, useMemo } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { STEP_CONFIG } from "../config/alignment";
import type { AlignmentSentence } from "../types/alignment";
import { ClozeWord } from "./ClozeWord";
import { PronunciationPractice } from "./PronunciationPractice";
import { PlayIcon } from "./icons/PlayIcon";
import { PauseIcon } from "./icons/PauseIcon";
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
      className={`p-3 sm:p-4 rounded-xl border transition-colors duration-200 ease-in-out mb-3 ${
        isActive
          ? "border-zinc-700 bg-[#0f0f10]"
          : "bg-[#0a0a0a] border-zinc-800 hover:border-zinc-700 hover:bg-[#0f0f10]"
      }`}
    >
      {config.showTokens && (
        <div className="flex flex-wrap gap-y-2 gap-x-1 sm:gap-y-5 sm:gap-x-3 items-end justify-center mb-4 sm:mb-10">
          {sortedItems.map((it, idx) => (
            <div
              key={`pair-${it.order}`}
              className={`flex flex-col items-center text-center py-1 px-1 sm:py-[0.35rem] sm:px-2 rounded-md transition-colors duration-150 ease-in-out${
                hoveredOrder === it.order ? " bg-[#18181b] shadow-[0_0_0_1px_#3f3f46]" : ""
              }`}
            >
              <div className="text-zinc-600 text-[0.65rem] sm:text-[0.8rem] font-medium mb-[0.35rem] lowercase tracking-[0.02em]">{it.target}</div>
              <div className={`relative text-rose-400 text-[0.9rem] sm:text-base font-bold leading-[1.1] border-b-2 border-transparent pb-[0.1rem]${idx === 0 ? " capitalize" : ""}${it.occurrence_count === 1 ? " !border-dashed !border-[rgba(251,113,133,0.5)] !pb-1" : ""}`}>
                {it.source}
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className="pt-3 sm:pt-8 border-t border-dashed border-zinc-800 flex flex-col gap-3 sm:gap-4 items-center text-center relative"
        style={config.containerStyle}
      >
        {sentence.audio_url && config.showAudioBtn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (sentenceAudio.isPlaying) {
                sentenceAudio.pause();
              } else {
                playSentenceAudio();
              }
            }}
            className={`play-button${sentenceAudio.isPlaying ? " playing" : ""}`}
            title={sentenceAudio.isPlaying ? "Pause audio" : "Play audio"}
            style={config.audioBtnStyle}
          >
            {sentenceAudio.isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}

        {step === 6 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRecording(!isRecording);
            }}
            className={`absolute left-0 top-1/2 -translate-y-1/2 ${isRecording ? 'bg-red-500' : 'bg-zinc-700'} text-white border-0 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <div className="w-4 h-4 bg-white rounded-sm" />
            ) : (
              <div className="w-4 h-4 bg-red-500 rounded-full" />
            )}
          </button>
        )}

        {config.showSource && (
          <div className="text-zinc-100 text-[0.9rem] sm:text-base leading-relaxed font-normal max-w-full break-normal px-1 sm:px-2">
            {sortedItems.map((it, idx) => (
              <span
                key={`s-${it.order}`}
                className={`rounded px-1 transition-all duration-150${idx === 0 ? " capitalize" : ""}${
                  hoveredOrder === it.order ? " text-rose-400" : ""
                } hover:text-white${config.allowWordClick ? " cursor-pointer" : " cursor-default"}`}
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
            className="text-zinc-500 text-[0.9rem] sm:text-base italic font-normal max-w-full break-normal px-1 sm:px-2 leading-normal"
            style={config.targetStyle}
          >
            {sentence.target_sentence}
          </div>
        )}

        {step === 6 && (
          <PronunciationPractice
            targetText={sentence.source_sentence}
            language={language}
            words={sortedItems.map(item => ({ id: item.id, word: item.source }))}
            isRecording={isRecording}
          />
        )}
      </div>
    </div>
  );
}
