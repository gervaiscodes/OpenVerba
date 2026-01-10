import type { FastifyReply } from "fastify";
import { TextStepCompletionService } from "../services/textStepCompletionService.js";
import { AuthRequest } from "../middleware/auth.js";

interface MarkStepCompleteBody {
  text_id: number;
  step_number: number;
}

export class TextStepCompletionController {
  /**
   * POST /api/text-step-completions
   * Mark a step as complete
   */
  static async markComplete(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const { text_id, step_number } = request.body as MarkStepCompleteBody;

      if (!text_id || typeof text_id !== "number") {
        return reply
          .status(400)
          .send({ error: "text_id is required and must be a number" });
      }

      if (!step_number || typeof step_number !== "number") {
        return reply
          .status(400)
          .send({ error: "step_number is required and must be a number" });
      }

      TextStepCompletionService.markStepComplete(text_id, step_number, userId);

      return reply.status(201).send({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      if (error instanceof Error && error.message.includes("Step number")) {
        return reply.status(400).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to mark step complete" });
    }
  }

  /**
   * GET /api/texts/:id/step-completions
   * Get completed steps for a text
   */
  static async getCompletions(request: AuthRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const textId = parseInt(id, 10);

    if (isNaN(textId)) {
      return reply.status(400).send({ error: "Invalid text ID" });
    }

    try {
      const completedSteps = TextStepCompletionService.getCompletedSteps(
        textId,
        userId
      );
      return { completed_steps: completedSteps };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to get completions" });
    }
  }

  /**
   * DELETE /api/texts/:id/step-completions
   * Reset all step completions for a text
   */
  static async reset(request: AuthRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const textId = parseInt(id, 10);

    if (isNaN(textId)) {
      return reply.status(400).send({ error: "Invalid text ID" });
    }

    try {
      TextStepCompletionService.resetCompletions(textId, userId);
      return reply.status(200).send({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to reset completions" });
    }
  }
}
