import type { FastifyRequest, FastifyReply } from "fastify";
import { CompletionService } from "../services/completionService.js";

interface CreateCompletionBody {
  word_id: number;
}

export class CompletionController {
  static async create(
    request: FastifyRequest<{ Body: CreateCompletionBody }>,
    reply: FastifyReply
  ) {
    try {
      const { word_id } = request.body;

      if (!word_id || typeof word_id !== "number") {
        return reply
          .status(400)
          .send({ error: "word_id is required and must be a number" });
      }

      CompletionService.createCompletion(word_id);

      return reply.status(201).send({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to create completion" });
    }
  }

  static async getStreak(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const streak = CompletionService.getStreak();
      return reply.send({ streak });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get streak" });
    }
  }

  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = CompletionService.getCompletionStats();
      return reply.send({ stats });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ error: "Failed to get completion stats" });
    }
  }

  static async getTotal(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const total = CompletionService.getTotalCount();
      return reply.send({ total });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get total count" });
    }
  }
}
