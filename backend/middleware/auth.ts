import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

export interface AuthRequest extends FastifyRequest {
  user?: {
    userId: number;
    email: string;
  };
}

export async function requireAuth(
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies.auth_token;

  if (!token) {
    return reply.code(401).send({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
    };
    request.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
}

export async function optionalAuth(request: AuthRequest): Promise<void> {
  const token = request.cookies.auth_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
      };
      request.user = decoded;
    } catch (err) {
      // Invalid token - continue without auth
    }
  }
}
