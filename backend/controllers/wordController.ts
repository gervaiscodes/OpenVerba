import { FastifyReply } from "fastify";
import { WordService } from "../services/wordService.js";
import { AuthRequest } from "../middleware/auth.js";

export class WordController {
  static async getAll(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const words = WordService.getGroupedWords(userId);
      return words;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to fetch words",
        details: (err as Error).message,
      });
    }
  }
}
