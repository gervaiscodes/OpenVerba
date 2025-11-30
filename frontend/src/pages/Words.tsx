import "../App.css";
import { useEffect, useState, useRef } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { getLanguageName } from "../utils/languages";
import { PlayIcon } from "../components/icons/PlayIcon";

type Word = {
  id: number;
  source_word: string;
  target_word: string;
  source_language: string;
  occurrence_count: number;
  completion_count: number;
  audio_url?: string;
};

type GroupedWords = Record<string, Word[]>;

function WordItem({ word }: { word: Word }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { playbackRate } = useAudioSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  function playAudio() {
    if (!word.audio_url) return;
    setIsPlaying(true);
    const audio = new Audio(`${API_BASE_URL}${word.audio_url}`);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play().catch((e) => {
      console.error("Failed to play audio:", e);
      setIsPlaying(false);
    });
  }

  return (
    <li
      style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid #27272a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f0f10")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "2rem", height: "2rem", position: "relative", flexShrink: 0 }}>
          {word.audio_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playAudio();
              }}
              className={`play-button${isPlaying ? " playing" : ""}`}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "2rem",
                height: "2rem",
              }}
              title="Play audio"
            >
              <PlayIcon size={12} />
            </button>
          )}
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "#e4e4e7",
            }}
          >
            {word.source_word}
          </p>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              fontSize: "0.9rem",
              color: "#a1a1aa",
            }}
          >
            {word.target_word}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span
          className="badge"
          style={{
            background: "#27272a",
            color: "#a1a1aa",
            fontSize: "0.75rem",
          }}
        >
          {word.occurrence_count}{" "}
          {word.occurrence_count === 1 ? "appearance" : "appearances"}
        </span>
        {word.completion_count > 0 && (
          <span
            className="badge"
            style={{
              background: "#f97316",
              color: "#ffffff",
              fontSize: "0.75rem",
            }}
          >
            {word.completion_count}{" "}
            {word.completion_count === 1 ? "completion" : "completions"}
          </span>
        )}
      </div>
    </li>
  );
}

export default function Words() {
  const [groupedWords, setGroupedWords] = useState<GroupedWords>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/words`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch words");
        }
        return res.json();
      })
      .then((data) => {
        setGroupedWords(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", color: "#a1a1aa" }}
      >
        Loading words...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", color: "#ef4444" }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">
        Words
      </h1>

      {Object.keys(groupedWords).length === 0 ? (
        <div
          className="sentence"
          style={{ textAlign: "center", color: "#a1a1aa" }}
        >
          <p>No words found yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(groupedWords).map(([language, words]) => (
            <div
              key={language}
              style={{
                background: "#0a0a0a",
                borderRadius: "12px",
                border: "1px solid #27272a",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#18181b",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #27272a",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "#fff",
                    textTransform: "capitalize",
                  }}
                >
                  {getLanguageName(language)}
                </h2>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {words.map((word) => (
                  <WordItem key={word.id} word={word} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
