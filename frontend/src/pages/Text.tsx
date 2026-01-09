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

    fetch(apiUrl, {
      credentials: 'include',
    })
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
        credentials: 'include',
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
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm" style={{ marginBottom: "1.5rem" }}>
        <span className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">{getLanguageName(data.source_language)}</span>
        <span>→</span>
        <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">{getLanguageName(data.target_language)}</span>
      </div>

      <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800 mb-4 sm:mb-8 gap-0.5 sm:gap-1">
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 1 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(1)}
          data-number="1"
        >
          1. {getLanguageName(data.target_language)}
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 2 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(2)}
          data-number="2"
        >
          2. Listen
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 3 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(3)}
          data-number="3"
        >
          3. Dual
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 4 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(4)}
          data-number="4"
        >
          4. {getLanguageName(data.source_language)}
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 5 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(5)}
          data-number="5"
        >
          5. Write
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 6 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""}`}
          onClick={() => setStep(6)}
          data-number="6"
        >
          6. Speak
        </button>
      </div>

      <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm">
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
            className={playingIndex !== null ? "inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white" : ""}
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
