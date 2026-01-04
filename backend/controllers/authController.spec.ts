import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthController } from "./authController.js";
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

// Mock db.js to return an in-memory database
vi.mock("../lib/db.js", async () => {
  const mod = await import("better-sqlite3");
  const Database = mod.default || mod;
  return {
    default: new Database(":memory:"),
  };
});

// Import the mocked db instance
import db from "../lib/db.js";

// Import SCHEMA from the real module
const { SCHEMA } = await vi.importActual<typeof import("../lib/db.js")>(
  "../lib/db.js"
);

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

describe("AuthController", () => {
  let mockSetCookie: ReturnType<typeof vi.fn>;
  let mockClearCookie: ReturnType<typeof vi.fn>;
  let mockCode: ReturnType<typeof vi.fn>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset database schema
    db.exec(`
      DROP TABLE IF EXISTS completions;
      DROP TABLE IF EXISTS sentence_words;
      DROP TABLE IF EXISTS sentences;
      DROP TABLE IF EXISTS words;
      DROP TABLE IF EXISTS texts;
      DROP TABLE IF EXISTS users;
    `);
    db.exec(SCHEMA);

    // Reset mocks
    vi.clearAllMocks();

    // Create mock functions
    mockSetCookie = vi.fn();
    mockClearCookie = vi.fn();
    mockCode = vi.fn().mockReturnThis();
    mockSend = vi.fn();
  });

  describe("signup endpoint", () => {
    describe("successful signup", () => {
      it("should create account and set auth cookie", async () => {
        const request = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
          log: { error: vi.fn() },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.signup(request, reply);

        // Verify 201 status
        expect(mockCode).toHaveBeenCalledWith(201);

        // Verify response contains user object
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              id: expect.any(Number),
              email: TEST_EMAIL,
            }),
            message: "User created successfully",
          })
        );

        // Verify setCookie was called
        expect(mockSetCookie).toHaveBeenCalledWith(
          "auth_token",
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
          })
        );

        // Verify user exists in database
        const dbUser = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(TEST_EMAIL) as any;
        expect(dbUser).toBeDefined();
        expect(dbUser.email).toBe(TEST_EMAIL);
      });

      it("should return JWT token in cookie", async () => {
        const request = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockSetCookie).toHaveBeenCalled();

        // Verify token can be decoded
        const cookieCall = mockSetCookie.mock.calls[0];
        const token = cookieCall[1];

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        expect(decoded.userId).toBeDefined();
        expect(decoded.email).toBe(TEST_EMAIL);

        // Verify token expiration is 7 days
        const expiresIn = decoded.exp - decoded.iat;
        expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
      });

      it("should normalize email to lowercase", async () => {
        const request = {
          body: { email: "Test@Example.COM", password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              email: "test@example.com",
            }),
          })
        );
      });
    });

    describe("validation failures", () => {
      it("should return 400 when email is missing", async () => {
        const request = {
          body: { password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      });

      it("should return 400 when password is missing", async () => {
        const request = {
          body: { email: TEST_EMAIL },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      });

      it("should return 400 when both fields missing", async () => {
        const request = {
          body: {},
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
      });

      it("should return 400 with invalid email format", async () => {
        const request = {
          body: { email: "invalidemail", password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("Invalid email format"),
          })
        );
      });

      it("should return 400 with short password", async () => {
        const request = {
          body: { email: TEST_EMAIL, password: "short" },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.signup(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("at least 8 characters"),
          })
        );
      });
    });

    describe("duplicate email", () => {
      it("should return 400 when email already registered", async () => {
        // Create first user
        const request1 = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const reply1 = {
          code: mockCode,
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.signup(request1, reply1);

        // Reset mocks
        vi.clearAllMocks();
        const mockCode2 = vi.fn().mockReturnThis();
        const mockSend2 = vi.fn();

        // Attempt second signup with same email
        const request2 = {
          body: { email: TEST_EMAIL, password: "different123" },
        } as any;

        const reply2 = {
          code: mockCode2,
          send: mockSend2,
        } as any;

        await AuthController.signup(request2, reply2);

        expect(mockCode2).toHaveBeenCalledWith(400);
        expect(mockSend2).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("already registered"),
          })
        );
      });
    });
  });

  describe("login endpoint", () => {
    describe("successful login", () => {
      it("should authenticate and set auth cookie", async () => {
        // Create user first
        const signupRequest = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const signupReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
          setCookie: vi.fn(),
        } as any;

        await AuthController.signup(signupRequest, signupReply);

        // Now test login
        const request = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const reply = {
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.login(request, reply);

        // Verify response contains user object
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              id: expect.any(Number),
              email: TEST_EMAIL,
            }),
            message: "Login successful",
          })
        );

        // Verify setCookie called with 'auth_token'
        expect(mockSetCookie).toHaveBeenCalledWith(
          "auth_token",
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            sameSite: "strict",
          })
        );
      });

      it("should accept case-insensitive email", async () => {
        // Create user with lowercase email
        const signupRequest = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const signupReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
          setCookie: vi.fn(),
        } as any;

        await AuthController.signup(signupRequest, signupReply);

        // Login with uppercase email
        const request = {
          body: { email: "TEST@EXAMPLE.COM", password: TEST_PASSWORD },
        } as any;

        const reply = {
          send: mockSend,
          setCookie: mockSetCookie,
        } as any;

        await AuthController.login(request, reply);

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              email: TEST_EMAIL,
            }),
          })
        );
      });
    });

    describe("failed login", () => {
      it("should return 401 for wrong password", async () => {
        // Create user first
        const signupRequest = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const signupReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
          setCookie: vi.fn(),
        } as any;

        await AuthController.signup(signupRequest, signupReply);

        // Attempt login with wrong password
        const request = {
          body: { email: TEST_EMAIL, password: "wrongpassword" },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.login(request, reply);

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("Invalid email or password"),
          })
        );
      });

      it("should return 401 for non-existent user", async () => {
        const request = {
          body: { email: "nonexistent@example.com", password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.login(request, reply);

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("Invalid email or password"),
          })
        );
      });

      it("should return 400 when email missing", async () => {
        const request = {
          body: { password: TEST_PASSWORD },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.login(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
        expect(mockSend).toHaveBeenCalledWith({
          error: "Email and password are required",
        });
      });

      it("should return 400 when password missing", async () => {
        const request = {
          body: { email: TEST_EMAIL },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.login(request, reply);

        expect(mockCode).toHaveBeenCalledWith(400);
      });
    });

    describe("security", () => {
      it("should not expose whether email exists", async () => {
        // Create a user
        const signupRequest = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const signupReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
          setCookie: vi.fn(),
        } as any;

        await AuthController.signup(signupRequest, signupReply);

        // Try with wrong email
        const request1 = {
          body: { email: "wrong@example.com", password: TEST_PASSWORD },
        } as any;

        const reply1 = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
        } as any;

        await AuthController.login(request1, reply1);

        const error1 = reply1.send.mock.calls[0][0];

        // Try with wrong password
        const request2 = {
          body: { email: TEST_EMAIL, password: "wrongpassword" },
        } as any;

        const reply2 = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
        } as any;

        await AuthController.login(request2, reply2);

        const error2 = reply2.send.mock.calls[0][0];

        // Both should have the same error message
        expect(error1.error).toBe(error2.error);
      });
    });
  });

  describe("logout endpoint", () => {
    describe("cookie clearing", () => {
      it("should clear auth_token cookie", async () => {
        const request = {} as any;

        const reply = {
          send: mockSend,
          clearCookie: mockClearCookie,
        } as any;

        await AuthController.logout(request, reply);

        expect(mockClearCookie).toHaveBeenCalledWith("auth_token", {
          path: "/",
        });
        expect(mockSend).toHaveBeenCalledWith({ message: "Logout successful" });
      });

      it("should return success message", async () => {
        const request = {} as any;

        const reply = {
          send: mockSend,
          clearCookie: mockClearCookie,
        } as any;

        await AuthController.logout(request, reply);

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.any(String),
          })
        );
      });
    });
  });

  describe("me endpoint", () => {
    describe("authenticated request", () => {
      it("should return current user when authenticated", async () => {
        // Create user
        const signupRequest = {
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        } as any;

        const signupReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn(),
          setCookie: vi.fn(),
        } as any;

        await AuthController.signup(signupRequest, signupReply);

        const userId = signupReply.send.mock.calls[0][0].user.id;

        // Mock authenticated request
        const request = {
          user: { userId, email: TEST_EMAIL },
        } as any;

        const reply = {
          send: mockSend,
          code: mockCode,
        } as any;

        await AuthController.me(request, reply);

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            id: userId,
            email: TEST_EMAIL,
            created_at: expect.any(String),
          })
        );
      });
    });

    describe("unauthenticated request", () => {
      it("should return 401 when not authenticated", async () => {
        const request = {
          user: undefined,
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.me(request, reply);

        expect(mockCode).toHaveBeenCalledWith(401);
        expect(mockSend).toHaveBeenCalledWith({ error: "Not authenticated" });
      });
    });

    describe("non-existent user", () => {
      it("should return 404 when user deleted", async () => {
        // Mock request with userId that doesn't exist
        const request = {
          user: { userId: 99999, email: "deleted@example.com" },
        } as any;

        const reply = {
          code: mockCode,
          send: mockSend,
        } as any;

        await AuthController.me(request, reply);

        expect(mockCode).toHaveBeenCalledWith(404);
        expect(mockSend).toHaveBeenCalledWith({ error: "User not found" });
      });
    });
  });
});
