import db from "../lib/db.js";

export class CompletionService {
  static createCompletion(wordId: number): void {
    // Verify word exists
    const word = db.prepare("SELECT id FROM words WHERE id = ?").get(wordId);

    if (!word) {
      throw new Error(`Word with id ${wordId} not found`);
    }

    // Insert completion record
    db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);
  }
}
