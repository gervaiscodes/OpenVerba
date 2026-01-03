import { FastifyRequest, FastifyReply } from "fastify";
import { TextService } from "../services/textService.js";

export class TextController {
  static async create(request: FastifyRequest, reply: FastifyReply) {
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

    try {
      const result = await TextService.createText(
        body.text,
        body.source_language,
        body.target_language
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

  static async generate(request: FastifyRequest, reply: FastifyReply) {
    type Body = {
      source_language: string;
      new_words_percentage: number;
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

    try {
      const generatedText = await TextService.generateText(
        body.source_language,
        body.new_words_percentage
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

  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const texts = TextService.getAllTexts();
      return texts;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: "Failed to fetch texts",
        details: (err as Error).message,
      });
    }
  }

  static async getOne(request: FastifyRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    try {
      const text = TextService.getTextById(id);
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

  static async delete(request: FastifyRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    try {
      const success = TextService.deleteText(id);
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

  static async checkAudioStatus(request: FastifyRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    try {
      const status = TextService.getAudioStatus(id);
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
