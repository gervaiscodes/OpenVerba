import type { StepConfig } from "../types/alignment";

export const STEP_CONFIG: Record<number, StepConfig> = {
  1: {
    // Read Target (English)
    showTokens: false,
    showSource: false,
    showTarget: true,
    showAudioBtn: false,
    autoPlay: false,
    containerStyle: { paddingTop: 0, borderTop: "none" },
    targetStyle: { fontStyle: "normal", fontSize: "1.2rem", color: "#e4e4e7" },
    allowWordClick: false,
  },
  2: {
    // Listen (Target text shown, Source audio)
    showTokens: false,
    showSource: false,
    showTarget: true,
    showAudioBtn: true,
    audioBtnStyle: { left: 0, top: "50%", transform: "translate(0, -50%)" },
    autoPlay: true,
    containerStyle: {
      paddingLeft: "3rem",
      minHeight: "2.5rem",
      borderTop: "none",
      paddingTop: 0,
    },
    targetStyle: { fontStyle: "normal", fontSize: "1.2rem", color: "#e4e4e7" },
    allowWordClick: true,
  },
  3: {
    // Dual
    showTokens: true,
    showSource: true,
    showTarget: "conditional",
    showAudioBtn: true,
    autoPlay: true,
    allowWordClick: true,
  },
  4: {
    // Read Source (Spanish)
    showTokens: false,
    showSource: true,
    showTarget: false,
    showAudioBtn: false,
    autoPlay: false,
    containerStyle: { borderTop: "none", paddingTop: 0 },
    allowWordClick: true,
  },
  5: {
    // Practice (Cloze)
    showTokens: false,
    showSource: true,
    showTarget: false,
    showAudioBtn: true,
    audioBtnStyle: { left: 0, top: "50%", transform: "translate(0, -50%)" },
    autoPlay: false,
    containerStyle: {
      paddingLeft: "3rem",
      minHeight: "2.5rem",
      borderTop: "none",
      paddingTop: 0,
    },
    allowWordClick: false,
  },
  6: {
    // Speak (Pronunciation)
    showTokens: false,
    showSource: false, // Hidden because PronunciationPractice component handles display
    showTarget: false,
    showAudioBtn: false,
    autoPlay: false,
    containerStyle: {
      paddingLeft: "3rem",
      minHeight: "2.5rem",
      borderTop: "none",
      paddingTop: 0,
    },
    allowWordClick: false,
  },
};
