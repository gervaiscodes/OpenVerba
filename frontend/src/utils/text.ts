/**
 * Sort items by their order property
 */
export function sortByOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

/**
 * Check if a string is only punctuation
 */
export function isPunctuation(text: string): boolean {
  return /^[.,!?;:]+$/.test(text);
}

/**
 * Check if a word needs a space before it (not punctuation)
 */
export function needsSpaceBefore(text: string): boolean {
  return !/^[.,!?;:]/.test(text);
}

/**
 * Get the first N sentences from a text
 */
export function getFirstSentences(text: string, count: number): string {
  const sentenceEndings = /[.!?]+/g;
  let match;
  let sentenceCount = 0;
  let lastIndex = 0;

  while ((match = sentenceEndings.exec(text)) !== null) {
    sentenceCount++;
    if (sentenceCount === count) {
      lastIndex = match.index + match[0].length;
      break;
    }
  }

  if (lastIndex === 0) {
    return text;
  }

  return text.slice(0, lastIndex).trim();
}
