import "../App.css";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { getLanguageName } from "../utils/languages";
import { PlayIcon } from "../components/icons/PlayIcon";

type AlignmentItem = {
  order: number;
  source: string;
  target: string;
  audio_url?: string;
  occurrence_count?: number;
};

type AlignmentSentence = {
  id: number;
  source_sentence: string;
  target_sentence: string;
  audio_url?: string;
  items: AlignmentItem[];
};

type AlignmentData = {
  source_language: string;
  target_language: string;
  original_text: string;
  translation_data: string;
  sentences: AlignmentSentence[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type StepConfig = {
  showTokens: boolean;
  showSource: boolean;
  showTarget: boolean | "conditional";
  showAudioBtn: boolean;
  audioBtnStyle?: React.CSSProperties;
  autoPlay: boolean;
  containerStyle?: React.CSSProperties;
  targetStyle?: React.CSSProperties;
  allowWordClick: boolean;
};

const STEP_CONFIG: Record<number, StepConfig> = {
  1: {
    // Read Target (English)
    showTokens: false,
    showSource: false,
    showTarget: true,
    showAudioBtn: false,
    autoPlay: false,
    containerStyle: { paddingTop: 0, borderTop: "none" },
    targetStyle: { fontStyle: "normal", fontSize: "1.2rem", color: "#e4e4e7" },
    allowWordClick: false,
  },
  2: {
    // Listen (Target text shown, Source audio)
    showTokens: false,
    showSource: false,
    showTarget: true,
    showAudioBtn: true,
    audioBtnStyle: { left: 0, top: "50%" },
    autoPlay: true,
    containerStyle: { paddingLeft: "3rem", minHeight: "2.5rem", borderTop: "none", paddingTop: 0 },
    targetStyle: { fontStyle: "normal", fontSize: "1.2rem", color: "#e4e4e7" },
    allowWordClick: true,
  },
  3: {
    // Dual
    showTokens: true,
    showSource: true,
    showTarget: "conditional",
    showAudioBtn: true,
    autoPlay: true,
    allowWordClick: true,
  },
  4: {
    // Read Source (Spanish)
    showTokens: false,
    showSource: true,
    showTarget: false,
    showAudioBtn: false,
    autoPlay: false,
    containerStyle: { borderTop: "none", paddingTop: 0 },
    allowWordClick: true,
  },
  5: {
    // Practice (Cloze)
    showTokens: false,
    showSource: true,
    showTarget: false,
    showAudioBtn: true,
    audioBtnStyle: { left: 0, top: "50%" },
    autoPlay: false,
    containerStyle: { paddingLeft: "3rem", minHeight: "2.5rem", borderTop: "none", paddingTop: 0 },
    allowWordClick: false,
  },
};

function ClozeWord({ word }: { word: string }) {
  const [value, setValue] = useState("");

  // If word is too short or punctuation, just show it
  if (word.length <= 1 || /^[.,!?;:]+$/.test(word)) {
    return <span>{word}</span>;
  }

  const firstLetter = word[0];
  const rest = word.slice(1);
  const isCorrect = value.toLowerCase() === rest.toLowerCase();
  const isError = value.length > 0 && !isCorrect;

  useEffect(() => {
    if (isCorrect) {
      const inputs = Array.from(document.querySelectorAll(".cloze-input"));
      const currentInput = document.activeElement;
      const currentIndex = inputs.indexOf(currentInput as Element);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        (inputs[currentIndex + 1] as HTMLElement).focus();
      }
    }
  }, [isCorrect]);

  return (
    <span className="cloze-word" style={{ display: "inline-flex", alignItems: "baseline" }}>
      <span style={{ color: isCorrect ? "#4ade80" : isError ? "#ef4444" : "inherit", transition: "color 0.2s ease" }}>{firstLetter}</span>
      <input
        type="text"
        className="cloze-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          border: "none",
          borderBottom: `1px solid ${isCorrect ? "#4ade80" : isError ? "#ef4444" : "#52525b"}`,
          background: "transparent",
          color: isCorrect ? "#4ade80" : isError ? "#ef4444" : "inherit",
          width: `${rest.length + 0.5}ch`,
          padding: 0,
          marginLeft: "1px",
          outline: "none",
          fontFamily: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          transition: "all 0.2s ease"
        }}
      />
    </span>
  );
}

function SentenceAlignment({
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
        // If autoplay is off, we still need to signal end to move to next if needed?
        // Actually, playAll usually implies autoplay. If step doesn't support autoplay,
        // playAll might behave differently or just skip?
        // For now, if playAll is active but step doesn't autoplay, we might want to just stop or skip.
        // But the original logic for Step 1/4 was just to call onPlayEnd immediately if active.
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
       // If audio button is hidden, we generally don't play sentence audio
       // (Original logic: Step 4 disabled audio, Step 1 didn't have it)
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
                {/* Hide Target (Gray) in Step 2 & 4 (Logic handled by showTokens=false for those steps,
                    but Step 3 shows tokens.
                    Wait, original logic:
                    Step 3: showTokens=true. Inside token:
                      - show target if step === 3
                      - show source always

                    Actually, Step 2 and 4 had showTokens=false.
                    So if showTokens is true (Step 3), we show both source and target tokens?
                    Original code:
                    {step === 3 && <div className="src">{it.target}</div>}
                    <div className="tgt...">{it.source}</div>

                    So for Step 3, we show both.
                    If we ever have a step that shows tokens but NOT target token, we'd need more config.
                    For now, Step 3 is the only one with showTokens=true.
                */}
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
            {sentence.target_sentence}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Text() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AlignmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTarget, setShowTarget] = useState(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No text ID provided");
      return;
    }

    let cancelled = false;
    const apiUrl = `${API_BASE_URL}/api/texts/${id}`;

    fetch(apiUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load alignment");
        return r.json();
      })
      .then((json: AlignmentData) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data && !error) return <div>Loading…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!data) return null;

  const sentences = JSON.parse(data.translation_data).sentences;

  function handlePlayAll() {
    if (playingIndex !== null) {
      setPlayingIndex(null); // Stop
    } else {
      setPlayingIndex(0); // Start
    }
  }

  function handleSentenceEnd() {
    setPlayingIndex((prev) => {
      if (prev === null) return null;
      const next = prev + 1;
      if (next >= sentences.length) return null;
      return next;
    });
  }

  async function handleDelete() {
    if (!id) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/texts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete text");
      }

      // Redirect to home
      navigate("/");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete text. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="container">
      <div className="meta" style={{ marginBottom: "1.5rem" }}>
        <span className="badge badge-alt">{getLanguageName(data.source_language)}</span>
        <span>→</span>
        <span className="badge">{getLanguageName(data.target_language)}</span>
      </div>

      <div className="stepper">
        <button
          className={`step-btn${step === 1 ? " active" : ""}`}
          onClick={() => setStep(1)}
        >
          1. Read {getLanguageName(data.target_language)}
        </button>
        <button
          className={`step-btn${step === 2 ? " active" : ""}`}
          onClick={() => setStep(2)}
        >
          2. Listen
        </button>
        <button
          className={`step-btn${step === 3 ? " active" : ""}`}
          onClick={() => setStep(3)}
        >
          3. Dual
        </button>
        <button
          className={`step-btn${step === 4 ? " active" : ""}`}
          onClick={() => setStep(4)}
        >
          4. Read {getLanguageName(data.source_language)}
        </button>
        <button
          className={`step-btn${step === 5 ? " active" : ""}`}
          onClick={() => setStep(5)}
        >
          5. Practice
        </button>
      </div>

      <div className="meta">
        {step === 3 && (
          <button
            onClick={() => setShowTarget((v) => !v)}
            aria-pressed={showTarget}
          >
            {showTarget ? "Hide target sentences" : "Show target sentences"}
          </button>
        )}
        {step !== 1 && step !== 4 && (
          <button
            style={{ marginLeft: ".75rem" }}
            onClick={handlePlayAll}
            className={playingIndex !== null ? "badge badge-alt" : ""}
          >
            {playingIndex !== null ? "Stop Playing" : "Play All"}
          </button>
        )}
      </div>
      {sentences.map((s: AlignmentSentence, idx: number) => (
        <SentenceAlignment
          key={s.id}
          sentence={s}
          showTarget={showTarget}
          isActive={playingIndex === idx}
          onPlayEnd={handleSentenceEnd}
          step={step}
        />
      ))}

      {data.usage && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          borderTop: '1px solid #27272a',
          color: '#71717a',
          fontSize: '0.875rem',
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center'
        }}>
          <div>
            <strong style={{ color: '#a1a1aa' }}>Prompt Tokens:</strong> {data.usage.prompt_tokens}
          </div>
          <div>
            <strong style={{ color: '#a1a1aa' }}>Completion Tokens:</strong> {data.usage.completion_tokens}
          </div>
          <div>
            <strong style={{ color: '#a1a1aa' }}>Total Tokens:</strong> {data.usage.total_tokens}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Delete Text
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: '#a1a1aa' }}>Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: isDeleting ? 0.5 : 1
              }}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              style={{
                background: '#27272a',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
