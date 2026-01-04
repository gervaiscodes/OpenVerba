import type { FastifyReply } from "fastify";
import { CompletionService } from "../services/completionService.js";
import { AuthRequest } from "../middleware/auth.js";

interface CreateCompletionBody {
  word_id: number;
  method?: "writing" | "speaking";
}

export class CompletionController {
  static async create(
    request: AuthRequest,
    reply: FastifyReply
  ) {
    const userId = request.user!.userId;

    try {
      const { word_id, method } = request.body as CreateCompletionBody;

      if (!word_id || typeof word_id !== "number") {
        return reply
          .status(400)
          .send({ error: "word_id is required and must be a number" });
      }

      CompletionService.createCompletion(word_id, method, userId);

      return reply.status(201).send({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to create completion" });
    }
  }

  static async getStreak(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const streak = CompletionService.getStreak(userId);
      return reply.send({ streak });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get streak" });
    }
  }

  static async getStats(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const stats = CompletionService.getCompletionStats(userId);
      return reply.send({ stats });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ error: "Failed to get completion stats" });
    }
  }

  static async getTotal(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const total = CompletionService.getTotalCount(userId);
      return reply.send({ total });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get total count" });
    }
  }
}
