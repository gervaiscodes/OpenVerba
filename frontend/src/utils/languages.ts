import ISO6391 from "iso-639-1";

// Supported language codes
export const SUPPORTED_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "pl",
  "nl",
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export interface Language {
  code: string;
  name: string;
}

// Get all supported languages with their names
export const LANGUAGES: Language[] = SUPPORTED_LANGUAGE_CODES.map((code) => ({
  code,
  name: ISO6391.getName(code),
}));

// Get language name from code
export function getLanguageName(code: string): string {
  return ISO6391.getName(code) || code;
}

// Map ISO 639-1 codes to BCP 47 codes for SpeechRecognition
export function getBCP47Code(code: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    pl: "pl-PL",
    nl: "nl-NL",
  };
  return map[code] || "en-US";
}
