import db from "../lib/db.js";

export class WordService {
  static getGroupedWords() {
    const wordsStmt = db.prepare(`
      SELECT
        w.id,
        w.source_word,
        w.target_word,
        w.source_language,
        w.audio_url,
        COUNT(DISTINCT s.text_id) as occurrence_count,
        COUNT(DISTINCT c.id) as completion_count
      FROM words w
      JOIN sentence_words sw ON w.id = sw.word_id
      JOIN sentences s ON sw.sentence_id = s.id
      LEFT JOIN completions c ON w.id = c.word_id
      GROUP BY w.id
      ORDER BY w.source_language, occurrence_count DESC
    `);

    const words = wordsStmt.all() as Array<{
      id: number;
      source_word: string;
      target_word: string;
      source_language: string;
      audio_url: string | null;
      occurrence_count: number;
      completion_count: number;
    }>;

    const punctuationRegex = /^[\p{P}\p{S}]+$/u;

    const filteredWords = words.filter(
      (word) => !punctuationRegex.test(word.source_word)
    );

    return filteredWords.reduce(
      (acc, word) => {
        if (!acc[word.source_language]) {
          acc[word.source_language] = [];
        }
        acc[word.source_language].push(word);
        return acc;
      },
      {} as Record<string, typeof words>
    );
  }
}
