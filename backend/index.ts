import "dotenv/config";
import path from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { TextController } from "./controllers/textController.js";
import { WordController } from "./controllers/wordController.js";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
});

// Simple health route
fastify.get("/", async (_request, _reply) => {
  return { hello: "world!" };
});

// Text routes
fastify.post("/api/texts", TextController.create);
fastify.get("/api/texts", TextController.getAll);
fastify.get("/api/texts/:id", TextController.getOne);
fastify.delete("/api/texts/:id", TextController.delete);

// Generate route
fastify.post("/api/generate", TextController.generate);

// Word routes
fastify.get("/api/words", WordController.getAll);

async function start() {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

void start();
