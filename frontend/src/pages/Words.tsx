import "../App.css";
import { useEffect, useState, useRef } from "react";
import { useAudioSettings } from "../context/AudioSettingsContext";
import { API_BASE_URL } from "../config/api";
import { getLanguageName } from "../utils/languages";
import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";
import { WordsSkeleton } from "../components/skeletons/WordsSkeleton";

type Word = {
  id: number;
  source_word: string;
  target_word: string;
  source_language: string;
  occurrence_count: number;
  writing_count: number;
  speaking_count: number;
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

  function pauseAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  return (
    <li className="p-4 sm:px-6 border-b border-zinc-800 flex justify-between items-center transition-colors duration-200 hover:bg-[#0f0f10]">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 relative shrink-0">
          {word.audio_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) {
                  pauseAudio();
                } else {
                  playAudio();
                }
              }}
              className={`play-button${isPlaying ? " playing" : ""} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8`}
              title={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
            </button>
          )}
        </div>
        <div>
          <p className="m-0 text-[1.1rem] font-medium text-zinc-200">
            {word.source_word}
          </p>
          <p className="mt-1 mb-0 text-sm text-zinc-400">
            {word.target_word}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400">
          {word.occurrence_count}{" "}
          {word.occurrence_count === 1 ? "appearance" : "appearances"}
        </span>
        {word.writing_count > 0 && (
          <span
            className="inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white"
            title="Writing completions"
          >
            ✍️ {word.writing_count}
          </span>
        )}
        {word.speaking_count > 0 && (
          <span
            className="inline-flex items-center rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white"
            title="Speaking completions"
          >
            🗣️ {word.speaking_count}
          </span>
        )}
      </div>
    </li>
  );
}

const ITEMS_PER_PAGE = 20;

export default function Words() {
  const [groupedWords, setGroupedWords] = useState<GroupedWords>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/words`, {
      credentials: 'include',
    })
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
    return <WordsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  // Flatten all words for pagination
  const allWords = Object.entries(groupedWords).flatMap(([language, words]) =>
    words.map((word) => ({ ...word, language }))
  );

  const totalPages = Math.ceil(allWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWords = allWords.slice(startIndex, endIndex);

  // Re-group paginated words by language
  const paginatedGroupedWords = paginatedWords.reduce((acc, word) => {
    const lang = word.language;
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(word);
    return acc;
  }, {} as Record<string, typeof paginatedWords>);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <h1 className="mb-4 text-4xl font-extrabold text-center tracking-tight text-white sm:text-4xl text-2xl">
        Words
      </h1>

      {Object.keys(groupedWords).length === 0 ? (
        <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 transition-colors duration-200 ease-in-out mb-3 text-center text-zinc-400">
          <p>No words found yet.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-8">
            {Object.entries(paginatedGroupedWords).map(([language, words]) => (
              <div key={language} className="bg-[#0a0a0a] rounded-xl border border-zinc-800 overflow-hidden">
                <div className="bg-[#18181b] p-4 sm:px-6 border-b border-zinc-800">
                  <h2 className="m-0 text-xl font-semibold text-white capitalize">
                    {getLanguageName(language)}
                  </h2>
                </div>
                <ul className="list-none m-0 p-0">
                  {words.map((word) => (
                    <WordItem key={word.id} word={word} />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 p-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`py-2 px-4 border-0 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                }`}
              >
                Previous
              </button>

              <span className="text-zinc-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`py-2 px-4 border-0 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
