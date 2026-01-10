import "../App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { LANGUAGES } from "../utils/languages";

export default function Submit() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [sourceLang, setSourceLang] = useState("fr");
  const [targetLang, setTargetLang] = useState("pl");
  const [text, setText] = useState("");
  const [newWordsPercentage, setNewWordsPercentage] = useState(10);
  const [numberOfSentences, setNumberOfSentences] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onGenerate() {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_language: targetLang,
          new_words_percentage: newWordsPercentage,
          number_of_sentences: numberOfSentences,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setText(data.text);
    } catch (error) {
      console.error("Failed to generate text:", error);
      alert("Failed to generate text. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/texts`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          source_language: sourceLang,
          target_language: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      navigate(`/texts/${data.id}`);
    } catch (error) {
      console.error("Failed to submit text:", error);
      alert("Failed to submit text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <h1 className="mb-4 text-4xl font-extrabold text-center tracking-tight text-white sm:text-4xl text-2xl">New translation</h1>



      <div className="max-w-xl mx-auto bg-[#0a0a0a] p-4 sm:p-8 rounded-xl border border-zinc-800">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-zinc-400" htmlFor="source-language">I know...</label>
              <select
                id="source-language"
                className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-base transition-all focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-zinc-400" htmlFor="target-language">I want to learn...</label>
              <select
                id="target-language"
                className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-base transition-all focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="block mb-2 text-sm font-medium text-zinc-400" htmlFor="text-to-translate" style={{ marginBottom: 0 }}>
                {LANGUAGES.find(l => l.code === targetLang)?.name} text to translate
              </label>
              <button
                type="button"
                onClick={() => setMode(mode === "manual" ? "generate" : "manual")}
                style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "0.875rem", textDecoration: "underline" }}
              >
                {mode === "manual" ? "✨ Generate with AI" : "Switch to Manual Entry"}
              </button>
            </div>

            {mode === "generate" && (
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "#18181b", borderRadius: "8px", border: "1px solid #27272a" }}>
                <label className="block mb-2 text-sm font-medium text-zinc-400" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Number of sentences</span>
                  <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">{numberOfSentences}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={numberOfSentences}
                  onChange={(e) => setNumberOfSentences(Number(e.target.value))}
                  style={{ width: "100%", margin: "1rem 0" }}
                />
                <p style={{ fontSize: "0.875rem", color: "#a1a1aa", marginBottom: "1rem" }}>
                  The generated text will contain approximately {numberOfSentences} sentence{numberOfSentences !== 1 ? 's' : ''}.
                </p>

                <label className="block mb-2 text-sm font-medium text-zinc-400" style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                  <span>New words percentage</span>
                  <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">{newWordsPercentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newWordsPercentage}
                  onChange={(e) => setNewWordsPercentage(Number(e.target.value))}
                  style={{ width: "100%", margin: "1rem 0" }}
                />
                <p style={{ fontSize: "0.875rem", color: "#a1a1aa", marginBottom: "1rem" }}>
                  {newWordsPercentage}% of the text will be new words you haven't seen before.
                  {100 - newWordsPercentage}% will be words you already know.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-rose-400 text-white font-semibold text-base rounded-lg cursor-pointer transition-all hover:bg-rose-500 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-700"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  style={{ width: "100%" }}
                >
                  {isGenerating ? "Generating..." : "Generate Text with AI"}
                </button>
              </div>
            )}

            <textarea
              id="text-to-translate"
              className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-base transition-all focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={mode === "generate" ? "Generated text will appear here..." : "Enter text..."}
            />
          </div>

          <button type="submit" className="inline-flex items-center justify-center w-full py-3 px-6 bg-rose-400 text-white font-semibold text-base rounded-lg cursor-pointer transition-all hover:bg-rose-500 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-700" disabled={isLoading || !text}>
            {isLoading ? "Processing..." : "Translate Text"}
          </button>
        </form>
      </div>
    </div>
  );
}
