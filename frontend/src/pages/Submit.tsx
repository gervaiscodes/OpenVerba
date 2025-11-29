import "../App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { LANGUAGES } from "../utils/languages";

export default function Submit() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [sourceLang, setSourceLang] = useState("pl");
  const [targetLang, setTargetLang] = useState("fr");
  const [text, setText] = useState("");
  const [newWordsPercentage, setNewWordsPercentage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onGenerate() {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_language: sourceLang,
          new_words_percentage: newWordsPercentage,
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
    <div className="container">
      <h1 className="title">New translation</h1>



      <div className="form-container">
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="source-language">I want to learn...</label>
              <select
                id="source-language"
                className="form-control"
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
            <div className="form-group">
              <label className="form-label" htmlFor="target-language">I know...</label>
              <select
                id="target-language"
                className="form-control"
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

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-label" htmlFor="text-to-translate" style={{ marginBottom: 0 }}>
                {LANGUAGES.find(l => l.code === sourceLang)?.name} text to translate
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
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>New words percentage</span>
                  <span className="badge">{newWordsPercentage}%</span>
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
                  className="btn"
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
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={mode === "generate" ? "Generated text will appear here..." : "Enter text..."}
            />
          </div>

          <button type="submit" className="btn" disabled={isLoading || !text}>
            {isLoading ? "Processing..." : "Translate Text"}
          </button>
        </form>
      </div>
    </div>
  );
}
