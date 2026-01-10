import db from "../lib/db.js";

export class TextStepCompletionService {
  /**
   * Mark a step as complete for a specific text
   * Uses INSERT OR REPLACE to handle re-marking completed steps
   */
  static markStepComplete(
    textId: number,
    stepNumber: number,
    userId: number
  ): void {
    // Validate text exists and belongs to user
    const text = db
      .prepare("SELECT id FROM texts WHERE id = ? AND user_id = ?")
      .get(textId, userId);

    if (!text) {
      throw new Error(`Text with id ${textId} not found or access denied`);
    }

    // Validate step number (1-6)
    if (stepNumber < 1 || stepNumber > 6) {
      throw new Error("Step number must be between 1 and 6");
    }

    // Insert or replace completion (updates timestamp if already exists)
    db.prepare(`
      INSERT OR REPLACE INTO text_step_completions
        (text_id, step_number, user_id)
      VALUES (?, ?, ?)
    `).run(textId, stepNumber, userId);
  }

  /**
   * Get all completed steps for a specific text
   * Returns array of step numbers [1, 2, 5] etc.
   */
  static getCompletedSteps(textId: number, userId: number): number[] {
    const completions = db
      .prepare(`
        SELECT step_number
        FROM text_step_completions
        WHERE text_id = ? AND user_id = ?
        ORDER BY step_number
      `)
      .all(textId, userId) as { step_number: number }[];

    return completions.map((c) => c.step_number);
  }

  /**
   * Get completion counts for multiple texts (for homepage)
   * Returns map of textId -> completed count
   */
  static getCompletionCounts(
    textIds: number[],
    userId: number
  ): Map<number, number> {
    if (textIds.length === 0) {
      return new Map();
    }

    const placeholders = textIds.map(() => "?").join(",");
    const results = db
      .prepare(`
        SELECT text_id, COUNT(*) as count
        FROM text_step_completions
        WHERE text_id IN (${placeholders}) AND user_id = ?
        GROUP BY text_id
      `)
      .all(...textIds, userId) as { text_id: number; count: number }[];

    const map = new Map<number, number>();
    results.forEach((r) => map.set(r.text_id, r.count));
    return map;
  }

  /**
   * Reset all completions for a text (clear all 6 steps)
   */
  static resetCompletions(textId: number, userId: number): void {
    // Validate text exists and belongs to user
    const text = db
      .prepare("SELECT id FROM texts WHERE id = ? AND user_id = ?")
      .get(textId, userId);

    if (!text) {
      throw new Error(`Text with id ${textId} not found or access denied`);
    }

    db.prepare(`
      DELETE FROM text_step_completions
      WHERE text_id = ? AND user_id = ?
    `).run(textId, userId);
  }
}
