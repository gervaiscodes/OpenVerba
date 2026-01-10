import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompletionService } from "./completionService.js";

// Mock db.js to return an in-memory database
vi.mock("../lib/db.js", async () => {
  const mod = await import("better-sqlite3");
  const Database = mod.default || mod;
  return {
    default: new Database(":memory:"),
  };
});

// Import the mocked db instance
import db from "../lib/db.js";

// Import SCHEMA from the real module
const { SCHEMA } =
  await vi.importActual<typeof import("../lib/db.js")>("../lib/db.js");

describe("CompletionService", () => {
  const TEST_USER_ID = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize/Reset schema in the in-memory DB
    db.exec(`
      DROP TABLE IF EXISTS text_step_completions;
      DROP TABLE IF EXISTS completions;
      DROP TABLE IF EXISTS sentence_words;
      DROP TABLE IF EXISTS sentences;
      DROP TABLE IF EXISTS words;
      DROP TABLE IF EXISTS texts;
      DROP TABLE IF EXISTS users;
    `);
    db.exec(SCHEMA);

    // Create a test user
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)")
      .run(TEST_USER_ID, "test@example.com", "hashedpassword");
  });

  describe("createCompletion", () => {
    it("should create a completion for an existing word", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Create completion
      CompletionService.createCompletion(wordId, "writing", TEST_USER_ID);

      // Verify completion was created
      const completion = db
        .prepare("SELECT * FROM completions WHERE word_id = ?")
        .get(wordId) as { word_id: number; method: string };
      expect(completion).toBeDefined();
      expect(completion).toHaveProperty("word_id", wordId);
      expect(completion).toHaveProperty("method", "writing"); // Default
    });

    it("should create a completion with 'speaking' method", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Create completion with speaking method
      CompletionService.createCompletion(wordId, "speaking", TEST_USER_ID);

      // Verify completion was created with correct method
      const completion = db
        .prepare("SELECT * FROM completions WHERE word_id = ?")
        .get(wordId) as { word_id: number; method: string };
      expect(completion).toBeDefined();
      expect(completion.method).toBe("speaking");
    });

    it("should throw an error when word does not exist", () => {
      expect(() => {
        CompletionService.createCompletion(99999, "writing", TEST_USER_ID);
      }).toThrow("Word with id 99999 not found or access denied");
    });

    it("should create multiple completions for the same word", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Create multiple completions
      CompletionService.createCompletion(wordId, "writing", TEST_USER_ID);
      CompletionService.createCompletion(wordId, "writing", TEST_USER_ID);
      CompletionService.createCompletion(wordId, "writing", TEST_USER_ID);

      // Verify all completions were created
      const completions = db
        .prepare("SELECT * FROM completions WHERE word_id = ?")
        .all(wordId);
      expect(completions).toHaveLength(3);
    });
  });

  describe("getStreak", () => {
    it("should return 0 when no completions exist", () => {
      const streak = CompletionService.getStreak(TEST_USER_ID);
      expect(streak).toBe(0);
    });

    it("should return 1 when there is a completion today", () => {
      // Setup: Create a word and completion for today
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Insert completion (will use current timestamp)
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);

      const streak = CompletionService.getStreak(TEST_USER_ID);
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    it("should calculate streak for consecutive days", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Get today's date
      const todayResult = db
        .prepare(`SELECT date('now', 'localtime') as today`)
        .get() as { today: string };
      const today = todayResult.today;

      // Get yesterday's date
      const yesterdayResult = db
        .prepare(`SELECT date('now', 'localtime', '-1 day') as yesterday`)
        .get() as { yesterday: string };
      const yesterday = yesterdayResult.yesterday;

      // Create completions for today and yesterday
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 12:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${yesterday} 12:00:00`);

      const streak = CompletionService.getStreak(TEST_USER_ID);
      expect(streak).toBeGreaterThanOrEqual(2);
    });

    it("should return 0 when streak is broken (no completion today or yesterday)", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Create completion for 3 days ago (streak is broken)
      const threeDaysAgoResult = db
        .prepare(`SELECT date('now', 'localtime', '-3 days') as date`)
        .get() as { date: string };
      const threeDaysAgo = threeDaysAgoResult.date;

      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${threeDaysAgo} 12:00:00`);

      const streak = CompletionService.getStreak(TEST_USER_ID);
      expect(streak).toBe(0);
    });
  });

  describe("getCompletionStats", () => {
    it("should return empty array when no completions exist", () => {
      const stats = CompletionService.getCompletionStats(TEST_USER_ID);
      expect(stats).toEqual([]);
    });

    it("should return stats grouped by date", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Get today's date
      const todayResult = db
        .prepare(`SELECT date('now', 'localtime') as today`)
        .get() as { today: string };
      const today = todayResult.today;

      // Create multiple completions for today
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 10:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 11:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 12:00:00`);

      const stats = CompletionService.getCompletionStats(TEST_USER_ID);
      expect(stats.length).toBeGreaterThan(0);

      const todayStat = stats.find((s) => s.date === today);
      expect(todayStat).toBeDefined();
      expect(todayStat?.count).toBe(3);
    });

    it("should return stats for multiple days", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Get dates
      const todayResult = db
        .prepare(`SELECT date('now', 'localtime') as today`)
        .get() as { today: string };
      const today = todayResult.today;

      const yesterdayResult = db
        .prepare(`SELECT date('now', 'localtime', '-1 day') as yesterday`)
        .get() as { yesterday: string };
      const yesterday = yesterdayResult.yesterday;

      // Create completions for different days
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 10:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 11:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${yesterday} 10:00:00`);

      const stats = CompletionService.getCompletionStats(TEST_USER_ID);
      expect(stats.length).toBeGreaterThanOrEqual(2);

      const todayStat = stats.find((s) => s.date === today);
      expect(todayStat?.count).toBe(2);

      const yesterdayStat = stats.find((s) => s.date === yesterday);
      expect(yesterdayStat?.count).toBe(1);
    });

    it("should return stats ordered by date DESC", () => {
      // Setup: Create a word
      const wordId = Number(
        db
          .prepare(
            `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES ('hello', 'hola', 'en', 'es', ?)`
          )
          .run(TEST_USER_ID).lastInsertRowid
      );

      // Get dates
      const todayResult = db
        .prepare(`SELECT date('now', 'localtime') as today`)
        .get() as { today: string };
      const today = todayResult.today;

      const yesterdayResult = db
        .prepare(`SELECT date('now', 'localtime', '-1 day') as yesterday`)
        .get() as { yesterday: string };
      const yesterday = yesterdayResult.yesterday;

      // Create completions
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${yesterday} 10:00:00`);
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, ?)`
      ).run(wordId, `${today} 10:00:00`);

      const stats = CompletionService.getCompletionStats(TEST_USER_ID);
      expect(stats.length).toBeGreaterThanOrEqual(2);

      // First stat should be today (most recent)
      expect(stats[0].date).toBe(today);
      expect(stats[1].date).toBe(yesterday);
    });
  });
});
