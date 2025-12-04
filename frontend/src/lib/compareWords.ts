import { calculateSimilarity } from "./calculateSimilarity";

export type WordStatus = "correct" | "almost" | "wrong";

export interface WordResult {
  word: string;
  status: WordStatus;
  targetIndex?: number;
}

export function compareWords(target: string, transcript: string): WordResult[] {
  // Normalize and split into words
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,!?;:]/g, "")
      .trim();
  const targetWords = target.split(/\s+/).filter((w) => w.length > 0);
  const transcriptWords = transcript.split(/\s+/).filter((w) => w.length > 0);

  // If transcript is empty, return empty
  if (transcriptWords.length === 0) return [];

  const n = targetWords.length;
  const m = transcriptWords.length;

  // DP matrix for word alignment
  // dp[i][j] = min cost to align target[0..i-1] with transcript[0..j-1]
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const tWord = normalize(targetWords[i - 1]);
      const trWord = normalize(transcriptWords[j - 1]);

      const cost = tWord === trWord ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion (target word missing in transcript)
        dp[i][j - 1] + 1, // Insertion (extra word in transcript)
        dp[i - 1][j - 1] + cost // Match or Substitution
      );
    }
  }

  // Backtrack to find alignment and assign statuses
  let i = n;
  let j = m;

  // We build the result backwards, so we'll reverse it at the end
  // However, we only care about transcript words for the display

  const tempResults: WordResult[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const tWord = normalize(targetWords[i - 1]);
      const trWord = normalize(transcriptWords[j - 1]);
      const cost = tWord === trWord ? 0 : 1;

      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        // Match or Substitution
        if (cost === 0) {
          tempResults.push({
            word: transcriptWords[j - 1],
            status: "correct",
            targetIndex: i - 1,
          });
        } else {
          // Check for "almost" correct
          const similarity = calculateSimilarity(tWord, trWord);
          if (similarity >= 70) {
            // Threshold for almost correct
            tempResults.push({
              word: transcriptWords[j - 1],
              status: "almost",
              targetIndex: i - 1,
            });
          } else {
            tempResults.push({
              word: transcriptWords[j - 1],
              status: "wrong",
              targetIndex: i - 1,
            });
          }
        }
        i--;
        j--;
        continue;
      }
    }

    if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      // Insertion (extra word in transcript)
      tempResults.push({ word: transcriptWords[j - 1], status: "wrong" });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      // Deletion (target word missing) - we don't display this in "You said"
      i--;
    }
  }

  return tempResults.reverse();
}
