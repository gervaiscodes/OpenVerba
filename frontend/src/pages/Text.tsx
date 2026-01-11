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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE_URL}/api/texts/${id}/step-completions`, {
      credentials: 'include',
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load completions");
        return r.json();
      })
      .then((json: { completed_steps: number[] }) => {
        setCompletedSteps(json.completed_steps);
      })
      .catch((e: unknown) => {
        console.error("Failed to load completions:", e);
      });
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

  async function handleMarkStepComplete() {
    if (!id) return;
    setIsMarkingComplete(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/text-step-completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          text_id: parseInt(id, 10),
          step_number: step,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark step complete");
      }

      setCompletedSteps((prev) => {
        if (prev?.includes(step)) return prev;
        return [...(prev || []), step].sort();
      });

      if (step === 6) {
        navigate("/");
      } else {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Failed to mark step complete:", error);
      alert("Failed to mark step complete. Please try again.");
    } finally {
      setIsMarkingComplete(false);
    }
  }

  async function handleResetCompletions() {
    if (!id) return;
    setIsResetting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/texts/${id}/step-completions`,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset completions");
      }

      setCompletedSteps([]);
    } catch (error) {
      console.error("Failed to reset completions:", error);
      alert("Failed to reset completions. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm" style={{ marginBottom: "1.5rem" }}>
        <span className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">{getLanguageName(data.target_language)}</span>
        <span>→</span>
        <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">{getLanguageName(data.source_language)}</span>
      </div>

      <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800 mb-4 sm:mb-8 gap-0.5 sm:gap-1">
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 1 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(1) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(1)}
          data-number="1"
        >
          {completedSteps?.includes(1) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          1. {getLanguageName(data.source_language)}
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 2 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(2) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(2)}
          data-number="2"
        >
          {completedSteps?.includes(2) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          2. Listen
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 3 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(3) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(3)}
          data-number="3"
        >
          {completedSteps?.includes(3) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          3. Dual
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 4 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(4) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(4)}
          data-number="4"
        >
          {completedSteps?.includes(4) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          4. {getLanguageName(data.target_language)}
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 5 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(5) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(5)}
          data-number="5"
        >
          {completedSteps?.includes(5) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          5. Write
        </button>
        <button
          className={`step-btn flex-1 py-2 px-1 sm:py-2.5 sm:px-4 rounded-md border-none bg-transparent text-zinc-500 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-2 hover:text-zinc-200 hover:bg-zinc-900 ${step === 6 ? "active bg-zinc-800 text-white shadow-sm !border !border-zinc-700" : ""} ${completedSteps?.includes(6) ? "text-emerald-400 hover:text-emerald-300" : ""}`}
          onClick={() => setStep(6)}
          data-number="6"
        >
          {completedSteps?.includes(6) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
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
          language={getBCP47Code(data.target_language)}
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

      <div className="mt-12 border-t border-zinc-800 pt-6 pb-4">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleMarkStepComplete}
            disabled={isMarkingComplete || completedSteps?.includes(step)}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-all ${
              completedSteps?.includes(step)
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700 border-none cursor-pointer"
            } ${isMarkingComplete ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isMarkingComplete
              ? "Marking Complete..."
              : completedSteps?.includes(step)
              ? `Step ${step} Completed ✓`
              : `Mark Step ${step} Complete`}
          </button>

          <div className="flex items-center gap-2 text-xs">
            {completedSteps?.length > 0 && (
              <button
                onClick={handleResetCompletions}
                disabled={isResetting}
                className={`py-1 px-2.5 rounded bg-transparent text-zinc-500 border-none hover:text-zinc-300 transition-colors ${
                  isResetting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isResetting ? "Resetting..." : "Reset Completions"}
              </button>
            )}

            {completedSteps?.length > 0 && (
              <span className="text-zinc-700">•</span>
            )}

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="py-1 px-2.5 rounded bg-transparent text-red-500 border-none hover:text-red-400 transition-colors cursor-pointer"
              >
                Delete Text
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-zinc-500">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`py-1 px-2.5 rounded bg-red-600 text-white border-none text-xs hover:bg-red-700 transition-colors ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`py-1 px-2.5 rounded bg-zinc-800 text-zinc-300 border-none text-xs hover:bg-zinc-700 transition-colors ${
                    isDeleting ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
