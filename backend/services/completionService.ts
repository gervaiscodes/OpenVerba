import db from "../lib/db.js";

export class CompletionService {
  static createCompletion(
    wordId: number,
    method: "writing" | "speaking" = "writing",
    userId: number
  ): void {
    // Verify word exists and belongs to user
    const word = db.prepare("SELECT id FROM words WHERE id = ? AND user_id = ?").get(wordId, userId);

    if (!word) {
      throw new Error(`Word with id ${wordId} not found or access denied`);
    }

    // Insert completion record
    db.prepare("INSERT INTO completions (word_id, method) VALUES (?, ?)").run(
      wordId,
      method
    );
  }

  static getStreak(userId: number): number {
    // Get today's date using SQLite's date function to ensure consistency
    const todayResult = db
      .prepare(`SELECT date('now', 'localtime') as today`)
      .get() as { today: string };
    const today = todayResult.today;

    // Get all distinct completion dates ordered by date desc
    const dates = db
      .prepare(
        `SELECT DISTINCT date(c.completed_at, 'localtime') as completion_date
         FROM completions c
         JOIN words w ON c.word_id = w.id
         WHERE w.user_id = ?
         ORDER BY completion_date DESC`
      )
      .all(userId) as { completion_date: string }[];

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

  static getCompletionStats(userId: number): {
    date: string;
    count: number;
  }[] {
    // Get completion counts grouped by date (using localtime for consistency)
    const stats = db
      .prepare(
        `SELECT
          date(c.completed_at, 'localtime') as date,
          COUNT(*) as count
         FROM completions c
         JOIN words w ON c.word_id = w.id
         WHERE w.user_id = ?
         GROUP BY date(c.completed_at, 'localtime')
         ORDER BY date DESC`
      )
      .all(userId) as { date: string; count: number }[];

    return stats;
  }

  static getTotalCount(userId: number): number {
    const result = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM completions c
        JOIN words w ON c.word_id = w.id
        WHERE w.user_id = ?
      `)
      .get(userId) as { count: number };
    return result.count;
  }
}
