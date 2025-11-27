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
  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize/Reset schema in the in-memory DB
    db.exec(`
      DROP TABLE IF EXISTS sentence_words;
      DROP TABLE IF EXISTS sentences;
      DROP TABLE IF EXISTS words;
      DROP TABLE IF EXISTS texts;
    `);
    db.exec(SCHEMA);
  });

  describe("getAll", () => {
    it("should return all texts", async () => {
      // Setup data via SQL
      db.prepare(
        `
        INSERT INTO texts (text, source_language, target_language) VALUES ('Hello', 'en', 'fr')
      `
      ).run();
      db.prepare(
        `
        INSERT INTO texts (text, source_language, target_language) VALUES ('World', 'en', 'es')
      `
      ).run();

      const request = {
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
        INSERT INTO texts (text, source_language, target_language) VALUES ('Hello', 'en', 'fr')
      `
        )
        .run().lastInsertRowid;

      const request = {
        params: { id: String(id) },
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
        INSERT INTO texts (text, source_language, target_language) VALUES ('Hello', 'en', 'fr')
      `
        )
        .run().lastInsertRowid;

      const request = {
        params: { id: String(id) },
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
        INSERT INTO words (source_word, target_word, source_language, target_language)
        VALUES ('hello', 'bonjour', 'en', 'fr')
      `
      ).run();

      (generate as any).mockResolvedValue("Generated text");

      const request = {
        body: {
          source_language: "en",
          new_words_percentage: 20,
        },
        log: { error: vi.fn() },
      } as any;
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      const result = await TextController.generate(request, reply);

      expect(result).toEqual({ text: "Generated text" });
      expect(generate).toHaveBeenCalledWith(["hello"], 20, "en");
    });

    it("should return 400 if fields are missing", async () => {
      const request = {
        body: {
          // missing fields
        },
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
});
