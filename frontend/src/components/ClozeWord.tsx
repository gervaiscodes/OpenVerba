import { useState, useEffect } from "react";

export function ClozeWord({ word }: { word: string }) {
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
