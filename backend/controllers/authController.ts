import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/authService.js";
import { AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

export class AuthController {
  static async signup(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return reply.code(400).send({ error: "Email and password are required" });
    }

    try {
      const user = await AuthService.signup(body.email, body.password);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Set HTTP-only cookie
      reply.setCookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      return reply.code(201).send({
        user: { id: user.id, email: user.email },
        message: "User created successfully",
      });
    } catch (err) {
      const error = err as Error;
      return reply.code(400).send({ error: error.message });
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return reply.code(400).send({ error: "Email and password are required" });
    }

    try {
      const user = await AuthService.login(body.email, body.password);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Set HTTP-only cookie
      reply.setCookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      return reply.send({
        user: { id: user.id, email: user.email },
        message: "Login successful",
      });
    } catch (err) {
      const error = err as Error;
      return reply.code(401).send({ error: error.message });
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("auth_token", {
      path: "/",
    });

    return reply.send({ message: "Logout successful" });
  }

  static async me(request: AuthRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    const user = AuthService.getUserById(request.user.userId);

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    });
  }
}
