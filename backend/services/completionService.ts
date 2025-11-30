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
    // Get today's date using SQLite's date function to ensure consistency
    const todayResult = db
      .prepare(`SELECT date('now', 'localtime') as today`)
      .get() as { today: string };
    const today = todayResult.today;

    // Get all distinct completion dates ordered by date desc
    const dates = db
      .prepare(
        `SELECT DISTINCT date(completed_at, 'localtime') as completion_date
         FROM completions
         ORDER BY completion_date DESC`
      )
      .all() as { completion_date: string }[];

    if (dates.length === 0) {
      return 0;
    }

    // Calculate yesterday using SQLite
    const yesterdayResult = db
      .prepare(`SELECT date('now', 'localtime', '-1 day') as yesterday`)
      .get() as { yesterday: string };
    const yesterday = yesterdayResult.yesterday;

    // Check if we have completions today or yesterday
    const hasToday = dates.some((d) => d.completion_date === today);
    const hasYesterday = dates.some((d) => d.completion_date === yesterday);
    const latestDate = dates[0].completion_date;

    // If no completion today or yesterday, streak is broken
    if (!hasToday && !hasYesterday) {
      return 0;
    }

    // Start counting from today if we have completions today, otherwise from yesterday
    let streak = 0;
    let expectedDate = hasToday ? today : yesterday;

    // Create a Set for O(1) lookup
    const dateSet = new Set(dates.map((d) => d.completion_date));

    // Count consecutive days backwards from expectedDate
    while (dateSet.has(expectedDate)) {
      streak++;
      // Move to previous day using SQLite
      const prevDateResult = db
        .prepare(`SELECT date(?, '-1 day') as prev_date`)
        .get(expectedDate) as { prev_date: string };
      expectedDate = prevDateResult.prev_date;
    }

    return streak;
  }

  static getCompletionStats(): {
    date: string;
    count: number;
  }[] {
    // Get completion counts grouped by date (using localtime for consistency)
    const stats = db
      .prepare(
        `SELECT
          date(completed_at, 'localtime') as date,
          COUNT(*) as count
         FROM completions
         GROUP BY date(completed_at, 'localtime')
         ORDER BY date DESC`
      )
      .all() as { date: string; count: number }[];

    return stats;
  }
}
