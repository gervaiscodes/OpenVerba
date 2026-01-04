import { describe, it, expect, vi, beforeEach } from "vitest";
import { WordController } from "./wordController.js";

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

// Mock dependencies
vi.mock("../lib/translate.js", () => ({
  default: vi.fn(),
}));

vi.mock("../lib/audio.js", () => ({
  generateAudioForText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/generate.js", () => ({
  default: vi.fn(),
}));

import translate from "../lib/translate.js";

describe("WordController", () => {
  const TEST_USER_ID = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize/Reset schema in the in-memory DB
    db.exec(`
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

  describe("getAll", () => {
    it("should return grouped words populated via SQL", async () => {
      // 1. Setup Data using direct SQL
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Hello world', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const s1 = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence) VALUES (?, 1, 'Hello world', 'Bonjour le monde')
      `
        )
        .run(textId).lastInsertRowid;

      const w1 = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const w2 = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('world', 'monde', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 1)`
      ).run(s1, w1);
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 2)`
      ).run(s1, w2);

      // 2. Mock Request and Reply
      const request = {
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      // 3. Call Controller
      const result = await WordController.getAll(request, reply);

      // 4. Assertions
      expect(result).toBeDefined();
      expect(result).toHaveProperty("en");

      const enWords = result["en"];
      expect(enWords).toHaveLength(2);

      // Check for specific words
      const helloWord = enWords.find((w: any) => w.source_word === "hello");
      expect(helloWord).toBeDefined();
      expect(helloWord!.target_word).toBe("bonjour");

      const worldWord = enWords.find((w: any) => w.source_word === "world");
      expect(worldWord).toBeDefined();
      expect(worldWord!.target_word).toBe("monde");
    });

    it("should handle errors gracefully", async () => {
      // Force an error by mocking WordService.getGroupedWords to throw
      // But WordController calls WordService.getGroupedWords directly.
      // Since we are not mocking WordService, we can't easily force it to throw
      // unless we break the DB or mock the service method.
      // Let's mock the service method for this test case.

      const { WordService } = await import("../services/wordService.js");
      const originalGetGroupedWords = WordService.getGroupedWords;
      WordService.getGroupedWords = vi.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      const request = {
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await WordController.getAll(request, reply);

      expect(request.log.error).toHaveBeenCalled();
      expect(reply.code).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Failed to fetch words",
          details: "DB Error",
        })
      );

      // Restore original method
      WordService.getGroupedWords = originalGetGroupedWords;
    });
  });
});
