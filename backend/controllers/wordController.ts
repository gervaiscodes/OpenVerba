import { FastifyRequest, FastifyReply } from "fastify";
import { WordService } from "../services/wordService.js";

export class WordController {
  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const words = WordService.getGroupedWords();
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
