import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLanguageName, getBCP47Code } from "../utils/languages";
import { API_BASE_URL } from "../config/api";

import { SentenceAlignment } from "../components/SentenceAlignment";
import type { AlignmentData, AlignmentSentence } from "../types/alignment";
import { TextDetailSkeleton } from "../components/skeletons/TextDetailSkeleton";



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

  if (!data && !error) return <TextDetailSkeleton />;
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
          5. Write
        </button>
        <button
          className={`step-btn${step === 6 ? " active" : ""}`}
          onClick={() => setStep(6)}
        >
          6. Speak
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
        {step !== 1 && step !== 4 && step !== 5 && step !== 6 && (
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
          language={getBCP47Code(data.source_language)}
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
