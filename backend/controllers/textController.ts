import { FastifyReply } from "fastify";
import { TextService } from "../services/textService.js";
import { AuthRequest } from "../middleware/auth.js";

export class TextController {
  static async create(request: AuthRequest, reply: FastifyReply) {
    type Body = {
      text: string;
      source_language: string;
      target_language: string;
    };
    const body = request.body as Partial<Body> | undefined;

    if (!body || !body.text || !body.source_language || !body.target_language) {
      return reply.code(400).send({
        error:
          "Missing required fields: text, source_language, target_language",
      });
    }

    const userId = request.user!.userId;

    try {
      const result = await TextService.createText(
        body.text,
        body.source_language,
        body.target_language,
        userId
      );

      return reply.code(201).send({
        ...result,
        message: "Text saved successfully",
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to save text",
        details: (err as Error).message,
      });
    }
  }

  static async generate(request: AuthRequest, reply: FastifyReply) {
    type Body = {
      source_language: string;
      new_words_percentage: number;
      number_of_sentences?: number;
    };
    const body = request.body as Partial<Body> | undefined;

    if (
      !body ||
      !body.source_language ||
      body.new_words_percentage === undefined
    ) {
      return reply.code(400).send({
        error: "Missing required fields: source_language, new_words_percentage",
      });
    }

    const userId = request.user!.userId;

    try {
      const generatedText = await TextService.generateText(
        body.source_language,
        body.new_words_percentage,
        body.number_of_sentences,
        userId
      );
      return { text: generatedText };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to generate text",
        details: (err as Error).message,
      });
    }
  }

  static async getAll(request: AuthRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    try {
      const texts = TextService.getAllTexts(userId);
      return texts;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to fetch texts",
        details: (err as Error).message,
      });
    }
  }

  static async getOne(request: AuthRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    const userId = request.user!.userId;

    try {
      const text = TextService.getTextById(id, userId);
      if (!text) {
        return reply.code(404).send({ error: "Text not found" });
      }
      return text;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to fetch text",
        details: (err as Error).message,
      });
    }
  }

  static async delete(request: AuthRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    const userId = request.user!.userId;

    try {
      const success = TextService.deleteText(id, userId);
      if (!success) {
        return reply.code(404).send({ error: "Text not found" });
      }
      return reply.code(200).send({ message: "Text deleted successfully" });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to delete text",
        details: (err as Error).message,
      });
    }
  }

  static async checkAudioStatus(request: AuthRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    const userId = request.user!.userId;

    try {
      const status = TextService.getAudioStatus(id, userId);
      if (!status) {
        return reply.code(404).send({ error: "Text not found" });
      }
      return { audio_status: status };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to check audio status",
        details: (err as Error).message,
      });
    }
  }
}
