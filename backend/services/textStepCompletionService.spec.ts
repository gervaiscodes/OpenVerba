import { describe, it, expect, beforeEach, vi } from "vitest";
import { TextStepCompletionService } from "./textStepCompletionService.js";

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

describe("TextStepCompletionService", () => {
  beforeEach(() => {
    // Initialize/Reset schema in the in-memory DB
    db.exec(`
      DROP TABLE IF EXISTS text_step_completions;
      DROP TABLE IF EXISTS texts;
      DROP TABLE IF EXISTS users;
    `);
    db.exec(SCHEMA);

    // Insert test data
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (1, 'test@example.com', 'hash')").run();
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (2, 'user2@example.com', 'hash2')").run();
    db.prepare("INSERT INTO texts (id, text, source_language, target_language, user_id) VALUES (1, 'Test text', 'en', 'es', 1)").run();
    db.prepare("INSERT INTO texts (id, text, source_language, target_language, user_id) VALUES (2, 'Another text', 'en', 'fr', 1)").run();
    db.prepare("INSERT INTO texts (id, text, source_language, target_language, user_id) VALUES (3, 'User 2 text', 'en', 'de', 2)").run();
  });

  describe("markStepComplete", () => {
    it("should mark a step as complete", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);

      const completions = db
        .prepare("SELECT * FROM text_step_completions WHERE text_id = 1 AND user_id = 1")
        .all();

      expect(completions).toHaveLength(1);
      expect(completions[0]).toMatchObject({
        text_id: 1,
        step_number: 1,
        user_id: 1,
      });
    });

    it("should allow marking all 6 steps", () => {
      for (let step = 1; step <= 6; step++) {
        TextStepCompletionService.markStepComplete(1, step, 1);
      }

      const completions = db
        .prepare("SELECT * FROM text_step_completions WHERE text_id = 1 AND user_id = 1 ORDER BY step_number")
        .all() as any[];

      expect(completions).toHaveLength(6);
      expect(completions.map((c) => c.step_number)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should throw error for invalid step number (too low)", () => {
      expect(() => {
        TextStepCompletionService.markStepComplete(1, 0, 1);
      }).toThrow("Step number must be between 1 and 6");
    });

    it("should throw error for invalid step number (too high)", () => {
      expect(() => {
        TextStepCompletionService.markStepComplete(1, 7, 1);
      }).toThrow("Step number must be between 1 and 6");
    });

    it("should throw error for non-existent text", () => {
      expect(() => {
        TextStepCompletionService.markStepComplete(999, 1, 1);
      }).toThrow("Text with id 999 not found or access denied");
    });

    it("should throw error when marking another user's text", () => {
      expect(() => {
        TextStepCompletionService.markStepComplete(3, 1, 1); // Text 3 belongs to user 2
      }).toThrow("Text with id 3 not found or access denied");
    });

    it("should allow re-marking the same step (idempotent)", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 1, 1);

      const completions = db
        .prepare("SELECT * FROM text_step_completions WHERE text_id = 1 AND user_id = 1")
        .all();

      expect(completions).toHaveLength(1);
    });

    it("should enforce user isolation", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 2, 1);

      const user1Completions = TextStepCompletionService.getCompletedSteps(1, 1);
      const user2Completions = TextStepCompletionService.getCompletedSteps(1, 2);

      expect(user1Completions).toEqual([1, 2]);
      expect(user2Completions).toEqual([]);
    });
  });

  describe("getCompletedSteps", () => {
    it("should return empty array when no steps completed", () => {
      const steps = TextStepCompletionService.getCompletedSteps(1, 1);
      expect(steps).toEqual([]);
    });

    it("should return completed steps in order", () => {
      TextStepCompletionService.markStepComplete(1, 3, 1);
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 5, 1);

      const steps = TextStepCompletionService.getCompletedSteps(1, 1);
      expect(steps).toEqual([1, 3, 5]);
    });

    it("should only return steps for specified user", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(3, 2, 2);

      const user1Steps = TextStepCompletionService.getCompletedSteps(1, 1);
      const user2Steps = TextStepCompletionService.getCompletedSteps(3, 2);

      expect(user1Steps).toEqual([1]);
      expect(user2Steps).toEqual([2]);
    });
  });

  describe("getCompletionCounts", () => {
    it("should return empty map for empty array", () => {
      const counts = TextStepCompletionService.getCompletionCounts([], 1);
      expect(counts.size).toBe(0);
    });

    it("should return counts for multiple texts", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 2, 1);
      TextStepCompletionService.markStepComplete(1, 3, 1);
      TextStepCompletionService.markStepComplete(2, 1, 1);

      const counts = TextStepCompletionService.getCompletionCounts([1, 2], 1);

      expect(counts.get(1)).toBe(3);
      expect(counts.get(2)).toBe(1);
    });

    it("should return 0 for texts with no completions", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);

      const counts = TextStepCompletionService.getCompletionCounts([1, 2], 1);

      expect(counts.get(1)).toBe(1);
      expect(counts.get(2)).toBeUndefined();
    });

    it("should only count completions for specified user", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 2, 1);
      TextStepCompletionService.markStepComplete(3, 1, 2);

      const user1Counts = TextStepCompletionService.getCompletionCounts([1, 3], 1);
      const user2Counts = TextStepCompletionService.getCompletionCounts([1, 3], 2);

      expect(user1Counts.get(1)).toBe(2);
      expect(user1Counts.get(3)).toBeUndefined();
      expect(user2Counts.get(1)).toBeUndefined();
      expect(user2Counts.get(3)).toBe(1);
    });
  });

  describe("resetCompletions", () => {
    it("should remove all completions for a text", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(1, 2, 1);
      TextStepCompletionService.markStepComplete(1, 3, 1);

      TextStepCompletionService.resetCompletions(1, 1);

      const steps = TextStepCompletionService.getCompletedSteps(1, 1);
      expect(steps).toEqual([]);
    });

    it("should throw error for non-existent text", () => {
      expect(() => {
        TextStepCompletionService.resetCompletions(999, 1);
      }).toThrow("Text with id 999 not found or access denied");
    });

    it("should throw error when resetting another user's text", () => {
      expect(() => {
        TextStepCompletionService.resetCompletions(3, 1); // Text 3 belongs to user 2
      }).toThrow("Text with id 3 not found or access denied");
    });

    it("should only reset completions for specified text", () => {
      TextStepCompletionService.markStepComplete(1, 1, 1);
      TextStepCompletionService.markStepComplete(2, 2, 1);

      TextStepCompletionService.resetCompletions(1, 1);

      const text1Steps = TextStepCompletionService.getCompletedSteps(1, 1);
      const text2Steps = TextStepCompletionService.getCompletedSteps(2, 1);

      expect(text1Steps).toEqual([]);
      expect(text2Steps).toEqual([2]);
    });

    it("should be idempotent (can reset when already empty)", () => {
      expect(() => {
        TextStepCompletionService.resetCompletions(1, 1);
        TextStepCompletionService.resetCompletions(1, 1);
      }).not.toThrow();
    });
  });
});
