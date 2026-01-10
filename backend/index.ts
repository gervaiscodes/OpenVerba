import "dotenv/config";
import path from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { TextController } from "./controllers/textController.js";
import { WordController } from "./controllers/wordController.js";
import { CompletionController } from "./controllers/completionController.js";
import { TextStepCompletionController } from "./controllers/textStepCompletionController.js";
import { AuthController } from "./controllers/authController.js";
import { requireAuth } from "./middleware/auth.js";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || "CHANGE_ME_IN_PRODUCTION",
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "15 minutes",
});

await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
});

// Simple health route
fastify.get("/", async (_request, _reply) => {
  return { hello: "world!" };
});

// Auth routes (public - no authentication required)
fastify.post("/api/auth/signup", {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: "1 hour",
    },
  },
}, AuthController.signup);

fastify.post("/api/auth/login", {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: "15 minutes",
    },
  },
}, AuthController.login);

fastify.post("/api/auth/logout", AuthController.logout);

fastify.get("/api/auth/me", { preHandler: requireAuth }, AuthController.me);

// Text routes (protected - authentication required)
fastify.post("/api/texts", { preHandler: requireAuth }, TextController.create);
fastify.get("/api/texts", { preHandler: requireAuth }, TextController.getAll);
fastify.get("/api/texts/:id", { preHandler: requireAuth }, TextController.getOne);
fastify.get("/api/texts/:id/audio-status", { preHandler: requireAuth }, TextController.checkAudioStatus);
fastify.delete("/api/texts/:id", { preHandler: requireAuth }, TextController.delete);

// Generate route (protected)
fastify.post("/api/generate", { preHandler: requireAuth }, TextController.generate);

// Word routes (protected)
fastify.get("/api/words", { preHandler: requireAuth }, WordController.getAll);

// Completion routes (protected)
fastify.post("/api/completions", { preHandler: requireAuth }, CompletionController.create);
fastify.get("/api/completions/streak", { preHandler: requireAuth }, CompletionController.getStreak);
fastify.get("/api/completions/stats", { preHandler: requireAuth }, CompletionController.getStats);
fastify.get("/api/completions/total", { preHandler: requireAuth }, CompletionController.getTotal);

// Text step completion routes (protected)
fastify.post("/api/text-step-completions", { preHandler: requireAuth }, TextStepCompletionController.markComplete);
fastify.get("/api/texts/:id/step-completions", { preHandler: requireAuth }, TextStepCompletionController.getCompletions);
fastify.delete("/api/texts/:id/step-completions", { preHandler: requireAuth }, TextStepCompletionController.reset);

async function start() {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

void start();
