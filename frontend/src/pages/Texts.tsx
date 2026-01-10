import "../App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getLanguageName } from "../utils/languages";
import { getFirstSentences } from "../utils/text";
import { TextListSkeleton } from "../components/skeletons/TextListSkeleton";

type Text = {
  id: number;
  text: string;
  source_language: string;
  target_language: string;
  created_at: string;
  completed_steps: number;
};

export default function Texts() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/texts`, {
      credentials: 'include',
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load texts");
        return r.json();
      })
      .then((json: Text[]) => {
        if (!cancelled) {
          setTexts(json);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      {loading && <TextListSkeleton />}
      {error && <div className="text-[crimson]">Error: {error}</div>}
      {!loading && !error && texts.length === 0 && (
        <div>No texts found.</div>
      )}
      {!loading && !error && texts.length > 0 && (
        <div className="grid gap-4 max-w-[800px] mx-auto">
          {texts.map((t) => (
            <div
              key={t.id}
              className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 transition-colors duration-200 ease-in-out mb-3 hover:border-zinc-700 hover:bg-[#0f0f10] text-left cursor-pointer"
              onClick={() => navigate(`/texts/${t.id}`)}
            >
              <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm mb-2">
                <span className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">{getLanguageName(t.target_language)}</span>
                <span>→</span>
                <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">{getLanguageName(t.source_language)}</span>
                <span className="ml-auto text-sm opacity-70">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-preview whitespace-pre-wrap">{getFirstSentences(t.text, 2)}</div>
              <ProgressBar completed={t.completed_steps} total={6} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = (completed / total) * 100;

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 font-medium min-w-[3.5rem] text-right">
        {completed}/{total} steps
      </span>
    </div>
  );
}
