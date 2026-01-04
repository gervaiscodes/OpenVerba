import { describe, it, expect, vi, beforeEach } from "vitest";
import { TextService } from "./textService.js";
import { WordService } from "./wordService.js";
import { CompletionService } from "./completionService.js";
import { AuthService } from "./authService.js";

// Mock translate and generate functions
vi.mock("../lib/translate.js", () => ({
  default: vi.fn().mockResolvedValue({
    choice: { sentences: [] },
    usage: { total_tokens: 0 },
  }),
}));

vi.mock("../lib/generate.js", () => ({
  default: vi.fn().mockResolvedValue("Generated text"),
}));

vi.mock("../lib/audio.js", () => ({
  generateAudioForText: vi.fn().mockResolvedValue(undefined),
}));

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
const { SCHEMA } = await vi.importActual<typeof import("../lib/db.js")>(
  "../lib/db.js"
);

describe("Data Isolation", () => {
  let userAId: number;
  let userBId: number;

  beforeEach(async () => {
    // Reset database schema
    db.exec(`
      DROP TABLE IF EXISTS completions;
      DROP TABLE IF EXISTS sentence_words;
      DROP TABLE IF EXISTS sentences;
      DROP TABLE IF EXISTS words;
      DROP TABLE IF EXISTS texts;
      DROP TABLE IF EXISTS users;
    `);
    db.exec(SCHEMA);

    // Create two test users
    const userA = await AuthService.signup("usera@example.com", "password123");
    const userB = await AuthService.signup("userb@example.com", "password123");

    userAId = userA.id;
    userBId = userB.id;
  });

  describe("Text data isolation", () => {
    it("should not allow User A to see User B's texts", async () => {
      // User A creates a text
      await TextService.createText(
        "Hello from User A",
        "English",
        "French",
        userAId
      );

      // User B queries all texts
      const userBTexts = await TextService.getAllTexts(userBId);

      // User B should see empty array (no texts)
      expect(userBTexts).toEqual([]);
    });

    it("should not allow User A to access User B's text by ID", async () => {
      // User B creates a text
      const userBTextId = await TextService.createText(
        "Hello from User B",
        "English",
        "French",
        userBId
      );

      // User A tries to get User B's text by ID
      const text = await TextService.getTextById(
        String(userBTextId),
        userAId
      );

      // Should return null (not found)
      expect(text).toBeNull();
    });

    it("should not allow User A to delete User B's text", async () => {
      // User B creates a text
      const userBTextId = await TextService.createText(
        "Hello from User B",
        "English",
        "French",
        userBId
      );

      // Verify text was created
      const textsCount = db
        .prepare("SELECT COUNT(*) as count FROM texts WHERE user_id = ?")
        .get(userBId) as { count: number };
      expect(textsCount.count).toBe(1);

      // User A tries to delete User B's text
      const deleted = TextService.deleteText(String(userBTextId), userAId);

      // Should return false (not deleted)
      expect(deleted).toBe(false);

      // Verify text still exists in database
      const textsCountAfter = db
        .prepare("SELECT COUNT(*) as count FROM texts WHERE user_id = ?")
        .get(userBId) as { count: number };
      expect(textsCountAfter.count).toBe(1);
    });

    it("should allow users to see their own texts", async () => {
      // User A creates two texts
      await TextService.createText("Text 1", "English", "French", userAId);
      await TextService.createText("Text 2", "English", "French", userAId);

      // User B creates one text
      await TextService.createText("Text 3", "English", "Spanish", userBId);

      // User A should see only their 2 texts
      const userATexts = await TextService.getAllTexts(userAId);
      expect(userATexts).toHaveLength(2);

      // User B should see only their 1 text
      const userBTexts = await TextService.getAllTexts(userBId);
      expect(userBTexts).toHaveLength(1);
    });
  });

  describe("Word data isolation", () => {
    it("should not show User A's words to User B", async () => {
      // User A creates a word directly in DB (simulating text creation)
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("hello", "bonjour", "English", "French", userAId);

      // User B queries grouped words
      const userBWords = await WordService.getGroupedWords(userBId);

      // User B should see empty object (no words)
      expect(userBWords).toEqual({});
    });

    it("should allow same word for different users stored separately", async () => {
      // Directly check database - User A creates "hello" -> "bonjour"
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("hello", "bonjour", "English", "French", userAId);

      // User B creates "hello" -> "hola"
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("hello", "hola", "English", "Spanish", userBId);

      // Verify User A can only see their translation
      const userAWords = db
        .prepare(
          "SELECT * FROM words WHERE user_id = ? AND source_word = 'hello'"
        )
        .all(userAId) as any[];

      expect(userAWords).toHaveLength(1);
      expect(userAWords[0].target_word).toBe("bonjour");

      // Verify User B can only see their translation
      const userBWords = db
        .prepare(
          "SELECT * FROM words WHERE user_id = ? AND source_word = 'hello'"
        )
        .all(userBId) as any[];

      expect(userBWords).toHaveLength(1);
      expect(userBWords[0].target_word).toBe("hola");
    });

    it("should allow each user to have their own vocabulary", async () => {
      // User A creates words
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("hello", "bonjour", "English", "French", userAId);

      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("world", "monde", "English", "French", userAId);

      // User B creates words
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("cat", "gato", "English", "Spanish", userBId);

      // Verify User A has 2 words
      const userAWords = db
        .prepare("SELECT * FROM words WHERE user_id = ?")
        .all(userAId) as any[];
      expect(userAWords).toHaveLength(2);

      // Verify User B has 1 word
      const userBWords = db
        .prepare("SELECT * FROM words WHERE user_id = ?")
        .all(userBId) as any[];
      expect(userBWords).toHaveLength(1);
    });
  });

  describe("Completion data isolation", () => {
    it("should not show User A's completions to User B", async () => {
      // Create word for User A
      const wordAResult = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run("hello", "bonjour", "English", "French", userAId);

      const wordAId = wordAResult.lastInsertRowid as number;

      // User A completes the word
      await CompletionService.createCompletion(wordAId, "writing", userAId);

      // User B checks their completion stats
      const userBStats = await CompletionService.getCompletionStats(userBId);

      // User B should have empty stats
      expect(userBStats).toEqual([]);
    });

    it("should keep User A's streak independent of User B", async () => {
      // Create word for User A
      const wordAResult = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run("hello", "bonjour", "English", "French", userAId);

      const wordAId = wordAResult.lastInsertRowid as number;

      // User A completes word today
      db.prepare(
        `INSERT INTO completions (word_id, completed_at) VALUES (?, datetime('now', 'localtime'))`
      ).run(wordAId);

      // User A should have a streak
      const userAStreak = CompletionService.getStreak(userAId);
      expect(userAStreak).toBeGreaterThan(0);

      // User B should have no streak
      const userBStreak = CompletionService.getStreak(userBId);
      expect(userBStreak).toBe(0);
    });

    it("should not allow User A to complete User B's word", async () => {
      // Create word for User B
      const wordBResult = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run("hello", "bonjour", "English", "French", userBId);

      const wordBId = wordBResult.lastInsertRowid as number;

      // User A tries to complete User B's word - should throw error
      expect(() => {
        CompletionService.createCompletion(wordBId, "writing", userAId);
      }).toThrow("access denied");
    });

    it("should track completions separately for each user", async () => {
      // Create word for User A
      const wordAResult = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run("hello", "bonjour", "English", "French", userAId);

      const wordAId = wordAResult.lastInsertRowid as number;

      // Create word for User B
      const wordBResult = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run("cat", "gato", "English", "Spanish", userBId);

      const wordBId = wordBResult.lastInsertRowid as number;

      // User A completes 3 times
      await CompletionService.createCompletion(wordAId, "writing", userAId);
      await CompletionService.createCompletion(wordAId, "writing", userAId);
      await CompletionService.createCompletion(wordAId, "writing", userAId);

      // User B completes 1 time
      await CompletionService.createCompletion(wordBId, "writing", userBId);

      // User A should have 3 completions
      const userACount = await CompletionService.getTotalCount(userAId);
      expect(userACount).toBe(3);

      // User B should have 1 completion
      const userBCount = await CompletionService.getTotalCount(userBId);
      expect(userBCount).toBe(1);
    });
  });

  describe("Cross-user access attempts", () => {
    it("should prevent audio status check across users", async () => {
      // User B creates a text
      const userBTextId = await TextService.createText(
        "Hello from User B",
        "English",
        "French",
        userBId
      );

      // User A tries to check audio status of User B's text
      const status = await TextService.getAudioStatus(
        String(userBTextId),
        userAId
      );

      // Should return null (not found)
      expect(status).toBeNull();
    });

    it("should not allow cross-user data in generate endpoint", async () => {
      // User A creates words
      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("hello", "bonjour", "English", "French", userAId);

      db.prepare(
        `INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run("world", "monde", "English", "French", userAId);

      // User B generates text (should not use User A's words)
      const result = await TextService.generateText("English", 20, 4, userBId);

      // Verify the generate function was called (mocked)
      expect(result).toBeDefined();

      // The actual verification happens in the service - it should only query User B's words
      // Since User B has no words, the known words array should be empty
      const { default: generateMock } = await import("../lib/generate.js");
      expect(generateMock).toHaveBeenCalledWith(
        [], // Empty array - User B has no words
        20,
        "English",
        4
      );
    });
  });
});
