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
