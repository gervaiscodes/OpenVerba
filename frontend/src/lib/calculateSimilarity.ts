// Simple Levenshtein distance for scoring
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .trim();
  const s2 = str2
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .trim();

  if (s1 === s2) return 100;
  if (s1.length === 0) return 0;
  if (s2.length === 0) return 0;

  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}
