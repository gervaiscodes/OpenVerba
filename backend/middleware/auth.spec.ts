import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, optionalAuth, AuthRequest } from "./auth.js";
import { FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

describe("Auth Middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockCode: ReturnType<typeof vi.fn>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCode = vi.fn().mockReturnThis();
    mockSend = vi.fn();

    mockRequest = {
      cookies: {},
      user: undefined,
    };

    mockReply = {
      code: mockCode,
      send: mockSend,
    };
  });

  describe("requireAuth middleware", () => {
    describe("valid authentication", () => {
      it("should attach user to request with valid token", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

        mockRequest.cookies = { auth_token: token };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockRequest.user).toEqual(
          expect.objectContaining({
            userId: 1,
            email: "test@example.com",
          })
        );
        expect(mockCode).not.toHaveBeenCalled();
        expect(mockSend).not.toHaveBeenCalled();
      });

      it("should not modify request when token is valid", async () => {
        const payload = { userId: 42, email: "user@example.com" };
        const token = jwt.sign(payload, JWT_SECRET);

        mockRequest.cookies = { auth_token: token };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockRequest.user?.userId).toBe(42);
        expect(mockRequest.user?.email).toBe("user@example.com");
      });
    });

    describe("missing token", () => {
      it("should return 401 when cookie missing", async () => {
        mockRequest.cookies = {};

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Authentication required",
        });
        expect(mockRequest.user).toBeUndefined();
      });

      it("should return 401 when auth_token is undefined", async () => {
        mockRequest.cookies = { auth_token: undefined };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Authentication required",
        });
      });
    });

    describe("invalid token", () => {
      it("should return 401 for expired token", async () => {
        // Create token that expired 1 day ago
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "-1d" });

        mockRequest.cookies = { auth_token: token };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Invalid or expired token",
        });
        expect(mockRequest.user).toBeUndefined();
      });

      it("should return 401 for malformed token", async () => {
        mockRequest.cookies = { auth_token: "invalid.token.here" };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Invalid or expired token",
        });
      });

      it("should return 401 for token with wrong signature", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, "WRONG_SECRET");

        mockRequest.cookies = { auth_token: token };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Invalid or expired token",
        });
      });

      it("should return 401 for completely invalid token string", async () => {
        mockRequest.cookies = { auth_token: "not-a-jwt-token" };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Invalid or expired token",
        });
      });

      it("should return 401 for empty token string", async () => {
        mockRequest.cookies = { auth_token: "" };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Authentication required",
        });
      });
    });

    describe("token payload validation", () => {
      it("should extract userId and email from token", async () => {
        const payload = {
          userId: 123,
          email: "specific@example.com",
        };
        const token = jwt.sign(payload, JWT_SECRET);

        mockRequest.cookies = { auth_token: token };

        await requireAuth(
          mockRequest as AuthRequest,
          mockReply as FastifyReply
        );

        expect(mockRequest.user?.userId).toBe(123);
        expect(mockRequest.user?.email).toBe("specific@example.com");
      });
    });
  });

  describe("optionalAuth middleware", () => {
    describe("valid token", () => {
      it("should attach user when token valid", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, JWT_SECRET);

        mockRequest.cookies = { auth_token: token };

        await optionalAuth(mockRequest as AuthRequest);

        expect(mockRequest.user).toEqual(
          expect.objectContaining({
            userId: 1,
            email: "test@example.com",
          })
        );
      });

      it("should extract correct user data from token", async () => {
        const payload = { userId: 999, email: "optional@example.com" };
        const token = jwt.sign(payload, JWT_SECRET);

        mockRequest.cookies = { auth_token: token };

        await optionalAuth(mockRequest as AuthRequest);

        expect(mockRequest.user?.userId).toBe(999);
        expect(mockRequest.user?.email).toBe("optional@example.com");
      });
    });

    describe("invalid/missing token", () => {
      it("should not throw error when token missing", async () => {
        mockRequest.cookies = {};

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });

      it("should silently ignore invalid token", async () => {
        mockRequest.cookies = { auth_token: "invalid.token" };

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });

      it("should silently ignore expired token", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "-1d" });

        mockRequest.cookies = { auth_token: token };

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });

      it("should silently ignore token with wrong signature", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, "WRONG_SECRET");

        mockRequest.cookies = { auth_token: token };

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });

      it("should handle undefined auth_token", async () => {
        mockRequest.cookies = { auth_token: undefined };

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });

      it("should handle empty string token", async () => {
        mockRequest.cookies = { auth_token: "" };

        await expect(
          optionalAuth(mockRequest as AuthRequest)
        ).resolves.not.toThrow();

        expect(mockRequest.user).toBeUndefined();
      });
    });

    describe("no reply interaction", () => {
      it("should not call reply methods on success", async () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = jwt.sign(payload, JWT_SECRET);

        mockRequest.cookies = { auth_token: token };

        await optionalAuth(mockRequest as AuthRequest);

        // optionalAuth doesn't take a reply parameter
        // Just verify it completes without error
        expect(mockRequest.user).toBeDefined();
      });

      it("should not call reply methods on failure", async () => {
        mockRequest.cookies = { auth_token: "invalid" };

        await optionalAuth(mockRequest as AuthRequest);

        // Should complete silently without error
        expect(mockRequest.user).toBeUndefined();
      });
    });
  });

  describe("edge cases", () => {
    it("requireAuth should handle token with extra claims", async () => {
      const payload = {
        userId: 1,
        email: "test@example.com",
        extraClaim: "should be ignored",
      };
      const token = jwt.sign(payload, JWT_SECRET);

      mockRequest.cookies = { auth_token: token };

      await requireAuth(mockRequest as AuthRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          userId: 1,
          email: "test@example.com",
          extraClaim: "should be ignored",
        })
      );
    });

    it("optionalAuth should handle token with extra claims", async () => {
      const payload = {
        userId: 1,
        email: "test@example.com",
        role: "admin",
      };
      const token = jwt.sign(payload, JWT_SECRET);

      mockRequest.cookies = { auth_token: token };

      await optionalAuth(mockRequest as AuthRequest);

      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          userId: 1,
          email: "test@example.com",
          role: "admin",
        })
      );
    });
  });
});
