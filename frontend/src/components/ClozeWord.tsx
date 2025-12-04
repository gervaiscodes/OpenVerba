import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config/api";
import { Firework } from "./Firework";
import { useCoin } from "../context/CoinContext";

export function ClozeWord({ word, wordId }: { word: string; wordId?: number }) {
  const [value, setValue] = useState("");
  const [showFirework, setShowFirework] = useState(false);
  const hasSubmitted = useRef(false);
  const { increment } = useCoin();

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
      if (!hasSubmitted.current) {
        setShowFirework(true);
        setTimeout(() => setShowFirework(false), 1000);
      }
      if (wordId && !hasSubmitted.current) {
        hasSubmitted.current = true;
        fetch(`${API_BASE_URL}/api/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ word_id: wordId, method: "writing" }),
        })
          .then((res) => {
            if (res.ok) {
              increment();
            }
            return res.json();
          })
          .catch((e) => {
            // Silently handle errors to not disrupt user experience
            console.error("Failed to record completion:", e);
          });
      }

      // Move to next input
      const inputs = Array.from(document.querySelectorAll(".cloze-input"));
      const currentInput = document.activeElement;
      const currentIndex = inputs.indexOf(currentInput as Element);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        (inputs[currentIndex + 1] as HTMLElement).focus();
      }
    }
  }, [isCorrect, wordId]);

  return (
    <span className="cloze-word" style={{ display: "inline-flex", alignItems: "baseline", position: "relative" }}>
      {showFirework && <Firework />}
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
