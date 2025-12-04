import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompletionController } from "./completionController.js";

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

describe("CompletionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize/Reset schema in the in-memory DB
    db.exec(`
      DROP TABLE IF EXISTS completions;
      DROP TABLE IF EXISTS sentence_words;
      DROP TABLE IF EXISTS sentences;
      DROP TABLE IF EXISTS words;
      DROP TABLE IF EXISTS texts;
    `);
    db.exec(SCHEMA);
  });

  describe("create", () => {
    it("should create a completion successfully", async () => {
      // Setup: Create a word first
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      const request = {
        body: { word_id: wordId },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(reply.status).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith({ success: true });

      // Verify completion was created in DB
      const completion = db
        .prepare("SELECT * FROM completions WHERE word_id = ?")
        .get(wordId);
      expect(completion).toBeDefined();
    });

    it("should pass method parameter to service", async () => {
      // Setup: Create a word first
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      // Spy on CompletionService.createCompletion
      const { CompletionService } = await import(
        "../services/completionService.js"
      );
      const createSpy = vi.spyOn(CompletionService, "createCompletion");

      const request = {
        body: { word_id: wordId, method: "speaking" },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(createSpy).toHaveBeenCalledWith(wordId, "speaking");
      expect(reply.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 when word_id is missing", async () => {
      const request = {
        body: {},
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        error: "word_id is required and must be a number",
      });
    });

    it("should return 400 when word_id is not a number", async () => {
      const request = {
        body: { word_id: "not-a-number" },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        error: "word_id is required and must be a number",
      });
    });

    it("should return 404 when word does not exist", async () => {
      const request = {
        body: { word_id: 99999 },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("not found"),
        })
      );
    });

    it("should handle errors gracefully", async () => {
      // Create a word
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      // Mock CompletionService to throw an error
      const { CompletionService } = await import(
        "../services/completionService.js"
      );
      const originalCreate = CompletionService.createCompletion;
      CompletionService.createCompletion = vi.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const request = {
        body: { word_id: wordId },
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await CompletionController.create(request, reply);

      expect(request.log.error).toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Failed to create completion",
      });

      // Restore original method
      CompletionService.createCompletion = originalCreate;
    });
  });

  describe("getStreak", () => {
    it("should return streak count", async () => {
      // Setup: Create a word and some completions
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      // Create a completion for today
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);

      const request = {} as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStreak(request, reply);

      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          streak: expect.any(Number),
        })
      );
    });

    it("should return 0 streak when no completions exist", async () => {
      const request = {} as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStreak(request, reply);

      expect(reply.send).toHaveBeenCalledWith({ streak: 0 });
    });

    it("should handle errors gracefully", async () => {
      // Mock CompletionService to throw an error
      const { CompletionService } = await import(
        "../services/completionService.js"
      );
      const originalGetStreak = CompletionService.getStreak;
      CompletionService.getStreak = vi.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const request = {} as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStreak(request, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Failed to get streak",
      });

      // Restore original method
      CompletionService.getStreak = originalGetStreak;
    });
  });

  describe("getStats", () => {
    it("should return completion stats", async () => {
      // Setup: Create a word and some completions
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      // Create some completions
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);

      const request = {
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStats(request, reply);

      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.any(Array),
        })
      );

      const response = reply.send.mock.calls[0][0];
      expect(response.stats.length).toBeGreaterThan(0);
      expect(response.stats[0]).toHaveProperty("date");
      expect(response.stats[0]).toHaveProperty("count");
    });

    it("should return empty stats array when no completions exist", async () => {
      const request = {
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStats(request, reply);

      expect(reply.send).toHaveBeenCalledWith({ stats: [] });
    });

    it("should handle errors gracefully", async () => {
      // Mock CompletionService to throw an error
      const { CompletionService } = await import(
        "../services/completionService.js"
      );
      const originalGetStats = CompletionService.getCompletionStats;
      CompletionService.getCompletionStats = vi.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const request = {
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getStats(request, reply);

      expect(request.log.error).toHaveBeenCalled();
      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Failed to get completion stats",
      });

      // Restore original method
      CompletionService.getCompletionStats = originalGetStats;
    });
  });

  describe("getTotal", () => {
    it("should return total count of completions", async () => {
      // Setup: Create a word and some completions
      const wordId = db
        .prepare(
          `INSERT INTO words (source_word, target_word, source_language, target_language)
           VALUES ('hello', 'hola', 'en', 'es')`
        )
        .run().lastInsertRowid;

      // Create some completions
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);
      db.prepare("INSERT INTO completions (word_id) VALUES (?)").run(wordId);

      const request = {} as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getTotal(request, reply);

      expect(reply.send).toHaveBeenCalledWith({ total: 3 });
    });

    it("should return 0 when no completions exist", async () => {
      const request = {} as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getTotal(request, reply);

      expect(reply.send).toHaveBeenCalledWith({ total: 0 });
    });

    it("should handle errors gracefully", async () => {
      // Mock CompletionService to throw an error
      const { CompletionService } = await import(
        "../services/completionService.js"
      );
      const originalGetTotal = CompletionService.getTotalCount;
      CompletionService.getTotalCount = vi.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const request = {
        log: {
          error: vi.fn(),
        },
      } as any;

      const reply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await CompletionController.getTotal(request, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Failed to get total count",
      });

      // Restore original method
      CompletionService.getTotalCount = originalGetTotal;
    });
  });
});
