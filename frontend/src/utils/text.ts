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
