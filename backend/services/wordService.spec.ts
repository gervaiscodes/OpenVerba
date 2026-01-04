import { describe, it, expect, vi, beforeEach } from "vitest";
import { WordService } from "./wordService.js";

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

describe("WordService", () => {
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

  describe("getGroupedWords", () => {
    it("should return words grouped by language and ordered by occurrence count", () => {
      // Setup data

      // Create texts
      const textId1 = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Text 1', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const textId2 = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Text 2', 'es', 'en', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      // Create sentences
      const s1 = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence) VALUES (?, 1, 'S1', 'T1')
      `
        )
        .run(textId1).lastInsertRowid;

      const s2 = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence) VALUES (?, 1, 'S2', 'T2')
      `
        )
        .run(textId1).lastInsertRowid; // Same text as s1

      const s3 = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence) VALUES (?, 1, 'S3', 'T3')
      `
        )
        .run(textId2).lastInsertRowid;

      // Create words
      // Word 1: 'hello' (en) - appears in s1 and s2 (same text) -> 1 text occurrence?
      // Wait, the query counts DISTINCT text_id.
      // Let's verify the query logic: COUNT(DISTINCT s.text_id)

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

      const w3 = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hola', 'hello', 'es', 'en', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const wPunct = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('...', '...', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      // Link words to sentences
      // w1 in s1 (text1)
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 1)`
      ).run(s1, w1);
      // w1 in s2 (text1) - same text, so occurrence count should be 1 if distinct text_id
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 1)`
      ).run(s2, w1);

      // w2 in s1 (text1)
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 2)`
      ).run(s1, w2);

      // w3 in s3 (text2)
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 1)`
      ).run(s3, w3);

      // wPunct in s1
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 3)`
      ).run(s1, wPunct);

      const result = WordService.getGroupedWords(TEST_USER_ID);

      expect(Object.keys(result)).toEqual(expect.arrayContaining(["en", "es"]));

      // Check English words
      const enWords = result["en"];
      expect(enWords).toHaveLength(2); // hello, world (punct excluded)

      // Verify sorting: both have 1 text occurrence.
      // If counts are equal, order is not strictly defined by the query unless we add secondary sort.
      // The query is: ORDER BY w.source_language, occurrence_count DESC
      // Let's add another text for w1 to make it have higher count.

      const textId3 = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Text 3', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;
      const s4 = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence) VALUES (?, 1, 'S4', 'T4')
      `
        )
        .run(textId3).lastInsertRowid;
      db.prepare(
        `INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence) VALUES (?, ?, 1)`
      ).run(s4, w1);

      // Now w1 has 2 distinct texts, w2 has 1.
      const result2 = WordService.getGroupedWords(TEST_USER_ID);
      const enWords2 = result2["en"];

      expect(enWords2[0].source_word).toBe("hello");
      expect(enWords2[0].occurrence_count).toBe(2);

      expect(enWords2[1].source_word).toBe("world");
      expect(enWords2[1].occurrence_count).toBe(1);

      // Check Spanish words
      const esWords = result2["es"];
      expect(esWords).toHaveLength(1);
      expect(esWords[0].source_word).toBe("hola");

      // Check Punctuation filtered
      const allWords = Object.values(result2).flat();
      const punctWords = allWords.filter((w) => w.source_word === "...");
      expect(punctWords).toHaveLength(0);
    });
  });
});
