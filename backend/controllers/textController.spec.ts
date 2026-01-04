import { describe, it, expect, vi, beforeEach } from "vitest";
import { TextController } from "./textController.js";

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
import generate from "../lib/generate.js";

describe("TextController", () => {
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
    it("should return all texts", async () => {
      // Setup data via SQL
      db.prepare(
        `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Hello', 'en', 'fr', ?)
      `
      ).run(TEST_USER_ID);
      db.prepare(
        `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('World', 'en', 'es', ?)
      `
      ).run(TEST_USER_ID);

      const request = {
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      const result = await TextController.getAll(request, reply);

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Hello" }),
          expect.objectContaining({ text: "World" }),
        ])
      );
    });
  });

  describe("getOne", () => {
    it("should return a text by ID", async () => {
      // Setup data via SQL
      const id = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Hello', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const request = {
        params: { id: String(id) },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      const result = await TextController.getOne(request, reply);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.text).toBe("Hello");
    });

    it("should return 404 if text not found", async () => {
      const request = {
        params: { id: "999" },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.getOne(request, reply);

      expect(reply.code).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "Text not found" });
    });
  });

  describe("create", () => {
    it("should create a new text", async () => {
      const mockTranslation = {
        choice: {
          sentences: [],
        },
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };
      (translate as any).mockResolvedValue(mockTranslation);

      const request = {
        body: {
          text: "Hello",
          source_language: "en",
          target_language: "fr",
        },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.create(request, reply);

      expect(reply.code).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Text saved successfully",
          id: expect.any(Number),
        })
      );

      // Verify DB
      const text = db
        .prepare("SELECT * FROM texts WHERE text = ?")
        .get("Hello");
      expect(text).toBeDefined();
    });

    it("should return 400 if fields are missing", async () => {
      const request = {
        body: {
          text: "Hello",
          // missing languages
        },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.create(request, reply);

      expect(reply.code).toHaveBeenCalledWith(400);
    });
  });

  describe("delete", () => {
    it("should delete a text", async () => {
      const id = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, user_id) VALUES ('Hello', 'en', 'fr', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const request = {
        params: { id: String(id) },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.delete(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);

      // Verify DB
      const text = db.prepare("SELECT * FROM texts WHERE id = ?").get(id);
      expect(text).toBeUndefined();
    });

    it("should return 404 if text not found", async () => {
      const request = {
        params: { id: "999" },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.delete(request, reply);

      expect(reply.code).toHaveBeenCalledWith(404);
    });
  });

  describe("generate", () => {
    it("should generate text", async () => {
      // Setup known words via SQL
      db.prepare(
        `
        INSERT INTO words (source_word, target_word, source_language, target_language, user_id)
        VALUES ('hello', 'bonjour', 'en', 'fr', ?)
      `
      ).run(TEST_USER_ID);

      (generate as any).mockResolvedValue("Generated text");

      const request = {
        body: {
          source_language: "en",
          new_words_percentage: 20,
        },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      const result = await TextController.generate(request, reply);

      expect(result).toEqual({ text: "Generated text" });
      expect(generate).toHaveBeenCalledWith(["hello"], 20, "en", 4);
    });

    it("should return 400 if fields are missing", async () => {
      const request = {
        body: {
          // missing fields
        },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.generate(request, reply);

      expect(reply.code).toHaveBeenCalledWith(400);
    });
  });

  describe("checkAudioStatus", () => {
    it("should return audio status for existing text", async () => {
      const id = db
        .prepare(
          `
        INSERT INTO texts (text, source_language, target_language, audio_status, user_id)
        VALUES ('Hello', 'en', 'fr', 'completed', ?)
      `
        )
        .run(TEST_USER_ID).lastInsertRowid;

      const request = {
        params: { id: String(id) },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      const result = await TextController.checkAudioStatus(request, reply);

      expect(result).toEqual({ audio_status: "completed" });
    });

    it("should return 404 if text not found", async () => {
      const request = {
        params: { id: "999" },
        user: { userId: TEST_USER_ID, email: "test@example.com" },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await TextController.checkAudioStatus(request, reply);

      expect(reply.code).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "Text not found" });
    });
  });
});
