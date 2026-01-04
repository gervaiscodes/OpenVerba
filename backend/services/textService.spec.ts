import { describe, it, expect, vi, beforeEach } from "vitest";
import { TextService } from "./textService.js";

// Mock db.js to return an in-memory database
vi.mock("../lib/db.js", async () => {
  const mod = await import("better-sqlite3");
  const Database = mod.default || mod;
  return {
    default: new Database(":memory:"),
    // We need to export SCHEMA here as well if we import it from the mocked module,
    // but since we are mocking the module, the real export might be lost if we don't include it.
    // However, we can import SCHEMA from the real module if we don't mock that part,
    // OR we can just redefine it here or rely on the fact that we only mock 'default'.
    // Actually, vi.mock mocks the whole module.
    // To keep it simple and avoid circular dependency issues with the mock factory,
    // let's just define the schema in the test setup or read it from the real file if possible.
    // BUT, the user explicitly asked to use backend/lib/db.ts.
    // If we mock "../lib/db.js", we can't easily import the real SCHEMA from it unless we use vi.importActual.
  };
});

// We need to use vi.importActual to get the real SCHEMA while mocking the default export.
// Let's adjust the mock strategy.

import db from "../lib/db.js";
import translate from "../lib/translate.js";
import generate from "../lib/generate.js";
import { generateAudioForText } from "../lib/audio.js";

// We need to import SCHEMA from the real module.
// Since we mocked "../lib/db.js", importing it normally gives the mock.
// We can use vi.importActual to get the real exports.
const { SCHEMA } =
  await vi.importActual<typeof import("../lib/db.js")>("../lib/db.js");

vi.mock("../lib/translate.js", () => ({
  default: vi.fn(),
}));

vi.mock("../lib/audio.js", () => ({
  generateAudioForText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/generate.js", () => ({
  default: vi.fn(),
}));

describe("TextService", () => {
  const TEST_USER_ID = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize/Reset schema in the in-memory DB
    // We drop tables to ensure a clean state for each test
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

  describe("createText", () => {
    it("should create a text and related data", async () => {
      const mockTranslation = {
        choice: {
          sentences: [
            {
              id: 1,
              source_sentence: "Hello",
              target_sentence: "Bonjour",
              items: [{ source: "Hello", target: "Bonjour", order: 1 }],
            },
          ],
        },
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };
      (translate as any).mockResolvedValue(mockTranslation);

      const result = await TextService.createText("Hello", "en", "fr", TEST_USER_ID);

      expect(translate).toHaveBeenCalledWith("Hello", "en", "fr");

      // Verify data in DB
      const text = db
        .prepare("SELECT * FROM texts WHERE id = ?")
        .get(result.id) as any;
      expect(text).toBeDefined();
      expect(text.text).toBe("Hello");
      expect(text.source_language).toBe("en");
      expect(text.target_language).toBe("fr");

      const sentences = db
        .prepare("SELECT * FROM sentences WHERE text_id = ?")
        .all(result.id) as any[];
      expect(sentences).toHaveLength(1);
      expect(sentences[0].source_sentence).toBe("Hello");
      expect(sentences[0].target_sentence).toBe("Bonjour");

      const words = db.prepare("SELECT * FROM words").all() as any[];
      expect(words).toHaveLength(1);
      expect(words[0].source_word).toBe("hello"); // Lowercase check
      expect(words[0].target_word).toBe("bonjour");

      // Verify audio status is set to processing
      expect(text.audio_status).toBe("processing");

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      // Verify generateAudioForText was called asynchronously
      expect(generateAudioForText).toHaveBeenCalledWith(
        expect.anything(),
        result.id,
        "en"
      );

      // Verify result includes audio_status
      expect(result).toEqual({
        id: expect.any(Number),
        translation: mockTranslation.choice,
        usage: mockTranslation.usage,
        audio_status: "processing",
      });
    });
  });

  describe("generateText", () => {
    it("should generate text using known words", async () => {
      // Insert some known words
      db.prepare(
        `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', ?), ('world', 'monde', 'en', 'fr', ?)
      `
      ).run(TEST_USER_ID, TEST_USER_ID);

      (generate as any).mockResolvedValue("Generated text");

      const result = await TextService.generateText("en", 50, 3, TEST_USER_ID);

      expect(generate).toHaveBeenCalledWith(["hello", "world"], 50, "en", 3);
      expect(result).toBe("Generated text");
    });
  });

  describe("getAllTexts", () => {
    it("should fetch and reconstruct all texts", () => {
      // Setup data
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id)
        VALUES ('Hello', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const sentenceId = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence, audio_url)
        VALUES (?, 1, 'Hello', 'Bonjour', 'audio.mp3')
      `
        )
        .run(textId).lastInsertRowid;

      const wordId = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      db.prepare(
        `
        INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence)
        VALUES (?, ?, 1)
      `
      ).run(sentenceId, wordId);

      const result = TextService.getAllTexts(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(textId);
      const translationData = JSON.parse(result[0].translation_data);
      expect(translationData.sentences).toHaveLength(1);
      expect(translationData.sentences[0].items).toHaveLength(1);
      expect(translationData.sentences[0].items[0].source).toBe("hello");
    });
  });

  describe("getTextById", () => {
    it("should fetch a single text by ID", () => {
      // Setup data
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, prompt_tokens, completion_tokens, total_tokens, user_id)
        VALUES ('Hello', 'en', 'fr', 10, 5, 15, ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const sentenceId = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence, audio_url)
        VALUES (?, 1, 'Hello', 'Bonjour', 'audio.mp3')
      `
        )
        .run(textId).lastInsertRowid;

      const wordId = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, audio_url, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', 'word.mp3', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      db.prepare(
        `
        INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence)
        VALUES (?, ?, 1)
      `
      ).run(sentenceId, wordId);

      const result = TextService.getTextById(String(textId), TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(textId);
      const translationData = JSON.parse(result!.translation_data);
      expect(translationData.sentences).toHaveLength(1);
      expect(translationData.sentences[0].items[0].audio_url).toBe("word.mp3");
    });

    it("should return null if text not found", () => {
      const result = TextService.getTextById("999", TEST_USER_ID);
      expect(result).toBeNull();
    });
  });

  describe("deleteText", () => {
    it("should delete text and related data", () => {
      // Setup data
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id)
        VALUES ('Hello', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const sentenceId = db
        .prepare(
          `
        INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence)
        VALUES (?, 1, 'Hello', 'Bonjour')
      `
        )
        .run(textId).lastInsertRowid;

      const wordId = db
        .prepare(
          `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      db.prepare(
        `
        INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence)
        VALUES (?, ?, 1)
      `
      ).run(sentenceId, wordId);

      const result = TextService.deleteText(String(textId), TEST_USER_ID);

      expect(result).toBe(true);

      // Verify deletion
      const text = db.prepare("SELECT * FROM texts WHERE id = ?").get(textId);
      expect(text).toBeUndefined();

      const sentences = db
        .prepare("SELECT * FROM sentences WHERE text_id = ?")
        .all(textId);
      expect(sentences).toHaveLength(0);

      const sentenceWords = db
        .prepare("SELECT * FROM sentence_words WHERE sentence_id = ?")
        .all(sentenceId);
      expect(sentenceWords).toHaveLength(0);

      // Words should remain
      const words = db.prepare("SELECT * FROM words WHERE id = ?").get(wordId);
      expect(words).toBeDefined();
    });

    it("should return false if text does not exist", () => {
      const result = TextService.deleteText("999", TEST_USER_ID);
      expect(result).toBe(false);
    });
  });

  describe("getAudioStatus", () => {
    it("should return audio status for existing text", () => {
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, audio_status, user_id)
        VALUES ('Hello', 'en', 'fr', 'completed', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const status = TextService.getAudioStatus(String(textId), TEST_USER_ID);
      expect(status).toBe("completed");
    });

    it("should return default pending status for newly created text", () => {
      const textId = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id)
        VALUES ('Hello', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const status = TextService.getAudioStatus(String(textId), TEST_USER_ID);
      expect(status).toBe("pending");
    });

    it("should return null if text does not exist", () => {
      const status = TextService.getAudioStatus("999", TEST_USER_ID);
      expect(status).toBeNull();
    });
  });
});
