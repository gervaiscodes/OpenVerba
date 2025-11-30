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

  static getStreak(): number {
    // Get all distinct completion dates ordered by date desc
    const dates = db
      .prepare(
        `SELECT DISTINCT date(completed_at) as completion_date
         FROM completions
         ORDER BY completion_date DESC`
      )
      .all() as { completion_date: string }[];

    if (dates.length === 0) {
      return 0;
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // If no completion today or yesterday, streak is broken (unless it's just starting today)
    // Actually, if the latest completion is not today or yesterday, streak is 0.
    const latestDate = dates[0].completion_date;
    if (latestDate !== today && latestDate !== yesterday) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date(latestDate);

    for (const { completion_date } of dates) {
      const dbDate = new Date(completion_date);

      // Check if this date matches the expected current date in the sequence
      if (
        dbDate.toISOString().split("T")[0] ===
        currentDate.toISOString().split("T")[0]
      ) {
        streak++;
        // Move expected date to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Gap found, streak ends
        break;
      }
    }

    return streak;
  }
}
