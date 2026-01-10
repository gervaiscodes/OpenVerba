import { describe, it, expect, vi, beforeEach } from "vitest";
import { TextStepCompletionController } from "./textStepCompletionController.js";
import type { AuthRequest } from "../middleware/auth.js";
import type { FastifyReply } from "fastify";

// Mock the service
vi.mock("../services/textStepCompletionService.js", () => {
  return {
    TextStepCompletionService: {
      markStepComplete: vi.fn(),
      getCompletedSteps: vi.fn(),
      getCompletionCounts: vi.fn(),
      resetCompletions: vi.fn(),
    },
  };
});

import { TextStepCompletionService } from "../services/textStepCompletionService.js";

describe("TextStepCompletionController", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      user: { userId: 1 },
      body: {},
      params: {},
      log: {
        error: vi.fn(),
      } as any,
    };

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe("markComplete", () => {
    it("should mark step as complete successfully", async () => {
      mockRequest.body = { text_id: 1, step_number: 3 };

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(TextStepCompletionService.markStepComplete).toHaveBeenCalledWith(1, 3, 1);
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({ success: true });
    });

    it("should return 400 if text_id is missing", async () => {
      mockRequest.body = { step_number: 1 };

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "text_id is required and must be a number",
      });
    });

    it("should return 400 if step_number is missing", async () => {
      mockRequest.body = { text_id: 1 };

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "step_number is required and must be a number",
      });
    });

    it("should return 400 if step_number is invalid", async () => {
      mockRequest.body = { text_id: 1, step_number: 7 };
      vi.mocked(TextStepCompletionService.markStepComplete).mockImplementation(() => {
        throw new Error("Step number must be between 1 and 6");
      });

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Step number must be between 1 and 6",
      });
    });

    it("should return 404 if text not found", async () => {
      mockRequest.body = { text_id: 999, step_number: 1 };
      vi.mocked(TextStepCompletionService.markStepComplete).mockImplementation(() => {
        throw new Error("Text with id 999 not found or access denied");
      });

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Text with id 999 not found or access denied",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      mockRequest.body = { text_id: 1, step_number: 1 };
      vi.mocked(TextStepCompletionService.markStepComplete).mockImplementation(() => {
        throw new Error("Database error");
      });

      await TextStepCompletionController.markComplete(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Failed to mark step complete",
      });
    });
  });

  describe("getCompletions", () => {
    it("should return completed steps", async () => {
      mockRequest.params = { id: "1" };
      vi.mocked(TextStepCompletionService.getCompletedSteps).mockReturnValue([1, 2, 3]);

      const result = await TextStepCompletionController.getCompletions(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(TextStepCompletionService.getCompletedSteps).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ completed_steps: [1, 2, 3] });
    });

    it("should return empty array when no completions", async () => {
      mockRequest.params = { id: "1" };
      vi.mocked(TextStepCompletionService.getCompletedSteps).mockReturnValue([]);

      const result = await TextStepCompletionController.getCompletions(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(result).toEqual({ completed_steps: [] });
    });

    it("should return 400 for invalid text ID", async () => {
      mockRequest.params = { id: "invalid" };

      await TextStepCompletionController.getCompletions(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ error: "Invalid text ID" });
    });

    it("should return 500 for service errors", async () => {
      mockRequest.params = { id: "1" };
      vi.mocked(TextStepCompletionService.getCompletedSteps).mockImplementation(() => {
        throw new Error("Database error");
      });

      await TextStepCompletionController.getCompletions(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Failed to get completions",
      });
    });
  });

  describe("reset", () => {
    it("should reset completions successfully", async () => {
      mockRequest.params = { id: "1" };

      await TextStepCompletionController.reset(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(TextStepCompletionService.resetCompletions).toHaveBeenCalledWith(1, 1);
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({ success: true });
    });

    it("should return 400 for invalid text ID", async () => {
      mockRequest.params = { id: "abc" };

      await TextStepCompletionController.reset(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ error: "Invalid text ID" });
    });

    it("should return 404 if text not found", async () => {
      mockRequest.params = { id: "999" };
      vi.mocked(TextStepCompletionService.resetCompletions).mockImplementation(() => {
        throw new Error("Text with id 999 not found or access denied");
      });

      await TextStepCompletionController.reset(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Text with id 999 not found or access denied",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      mockRequest.params = { id: "1" };
      vi.mocked(TextStepCompletionService.resetCompletions).mockImplementation(() => {
        throw new Error("Database error");
      });

      await TextStepCompletionController.reset(
        mockRequest as AuthRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Failed to reset completions",
      });
    });
  });
});
