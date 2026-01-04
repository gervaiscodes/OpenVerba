import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./authService.js";
import bcrypt from "bcrypt";

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

describe("AuthService", () => {
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
  });

  describe("signup", () => {
    describe("valid signup scenarios", () => {
      it("should create user with valid email and password", async () => {
        const email = "test@example.com";
        const password = "password123";

        const result = await AuthService.signup(email, password);

        // Verify returned user object
        expect(result).toEqual({
          id: expect.any(Number),
          email: email.toLowerCase(),
        });

        // Verify user exists in database
        const dbUser = db
          .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
          .get(email) as { id: number; email: string; password_hash: string };

        expect(dbUser).toBeDefined();
        expect(dbUser.email).toBe(email);
        expect(dbUser.password_hash).toBeDefined();

        // Verify password is hashed (not plain text)
        expect(dbUser.password_hash).not.toBe(password);
        expect(dbUser.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
      });

      it("should normalize email to lowercase", async () => {
        const email = "Test@Example.COM";
        const password = "password123";

        const result = await AuthService.signup(email, password);

        // Verify email stored as lowercase
        expect(result.email).toBe("test@example.com");

        const dbUser = db
          .prepare("SELECT email FROM users WHERE id = ?")
          .get(result.id) as { email: string };

        expect(dbUser.email).toBe("test@example.com");
      });

      it("should hash password with bcrypt", async () => {
        const email = "test@example.com";
        const password = "password123";

        await AuthService.signup(email, password);

        const dbUser = db
          .prepare("SELECT password_hash FROM users WHERE email = ?")
          .get(email) as { password_hash: string };

        // Verify bcrypt hash format
        expect(dbUser.password_hash).toMatch(/^\$2[aby]\$10\$/); // 10 rounds
      });
    });

    describe("validation errors", () => {
      it("should reject email without @ symbol", async () => {
        await expect(
          AuthService.signup("invalidemail", "password123")
        ).rejects.toThrow("Invalid email format");
      });

      it("should reject email without domain", async () => {
        await expect(
          AuthService.signup("test@", "password123")
        ).rejects.toThrow("Invalid email format");
      });

      it("should reject email with spaces", async () => {
        await expect(
          AuthService.signup("test @example.com", "password123")
        ).rejects.toThrow("Invalid email format");
      });

      it("should reject password shorter than 8 characters", async () => {
        await expect(
          AuthService.signup("test@example.com", "short")
        ).rejects.toThrow("Password must be at least 8 characters");
      });

      it("should reject empty email", async () => {
        await expect(
          AuthService.signup("", "password123")
        ).rejects.toThrow("Invalid email format");
      });

      it("should reject empty password", async () => {
        await expect(
          AuthService.signup("test@example.com", "")
        ).rejects.toThrow("Password must be at least 8 characters");
      });

      it("should accept password with exactly 8 characters", async () => {
        const result = await AuthService.signup(
          "test@example.com",
          "12345678"
        );
        expect(result.email).toBe("test@example.com");
      });
    });

    describe("duplicate email handling", () => {
      it("should throw error when email already exists", async () => {
        const email = "test@example.com";
        const password = "password123";

        // Create first user
        await AuthService.signup(email, password);

        // Attempt second signup with same email
        await expect(AuthService.signup(email, password)).rejects.toThrow(
          "Email already registered"
        );
      });

      it("should detect duplicate email case-insensitively", async () => {
        // Create user with lowercase email
        await AuthService.signup("test@example.com", "password123");

        // Attempt signup with uppercase email
        await expect(
          AuthService.signup("TEST@example.com", "password123")
        ).rejects.toThrow("Email already registered");
      });

      it("should detect duplicate with mixed case", async () => {
        // Create user with mixed case
        await AuthService.signup("Test@Example.com", "password123");

        // Attempt signup with different case
        await expect(
          AuthService.signup("test@EXAMPLE.com", "password123")
        ).rejects.toThrow("Email already registered");
      });
    });
  });

  describe("login", () => {
    describe("successful login", () => {
      it("should authenticate with correct credentials", async () => {
        const email = "test@example.com";
        const password = "password123";

        // Create user first
        await AuthService.signup(email, password);

        // Attempt login
        const result = await AuthService.login(email, password);

        expect(result).toEqual({
          id: expect.any(Number),
          email: email,
        });
      });

      it("should authenticate case-insensitively on email", async () => {
        const email = "test@example.com";
        const password = "password123";

        // Create user with lowercase email
        await AuthService.signup(email, password);

        // Login with uppercase email
        const result = await AuthService.login("TEST@example.com", password);

        expect(result.email).toBe(email);
      });

      it("should return user with correct id", async () => {
        const email = "test@example.com";
        const password = "password123";

        const signupResult = await AuthService.signup(email, password);
        const loginResult = await AuthService.login(email, password);

        expect(loginResult.id).toBe(signupResult.id);
      });
    });

    describe("failed login", () => {
      it("should reject non-existent email", async () => {
        await expect(
          AuthService.login("nonexistent@example.com", "password123")
        ).rejects.toThrow("Invalid email or password");
      });

      it("should reject incorrect password", async () => {
        const email = "test@example.com";
        const correctPassword = "password123";
        const wrongPassword = "wrongpassword";

        // Create user
        await AuthService.signup(email, correctPassword);

        // Attempt login with wrong password
        await expect(
          AuthService.login(email, wrongPassword)
        ).rejects.toThrow("Invalid email or password");
      });

      it("should not reveal which field was wrong", async () => {
        // Create a user
        await AuthService.signup("test@example.com", "password123");

        // Try with wrong email
        let errorMessage1 = "";
        try {
          await AuthService.login("wrong@example.com", "password123");
        } catch (error: any) {
          errorMessage1 = error.message;
        }

        // Try with wrong password
        let errorMessage2 = "";
        try {
          await AuthService.login("test@example.com", "wrongpassword");
        } catch (error: any) {
          errorMessage2 = error.message;
        }

        // Both should have the same generic error message
        expect(errorMessage1).toBe("Invalid email or password");
        expect(errorMessage2).toBe("Invalid email or password");
        expect(errorMessage1).toBe(errorMessage2);
      });

      it("should handle empty password", async () => {
        const email = "test@example.com";
        await AuthService.signup(email, "password123");

        await expect(AuthService.login(email, "")).rejects.toThrow(
          "Invalid email or password"
        );
      });
    });

    describe("password verification", () => {
      it("should verify password using bcrypt", async () => {
        const email = "test@example.com";
        const password = "password123";

        await AuthService.signup(email, password);

        const dbUser = db
          .prepare("SELECT password_hash FROM users WHERE email = ?")
          .get(email) as { password_hash: string };

        // Verify bcrypt can compare the password
        const isValid = await bcrypt.compare(password, dbUser.password_hash);
        expect(isValid).toBe(true);
      });

      it("should fail bcrypt verification with wrong password", async () => {
        const email = "test@example.com";
        const password = "password123";

        await AuthService.signup(email, password);

        const dbUser = db
          .prepare("SELECT password_hash FROM users WHERE email = ?")
          .get(email) as { password_hash: string };

        // Verify bcrypt rejects wrong password
        const isValid = await bcrypt.compare(
          "wrongpassword",
          dbUser.password_hash
        );
        expect(isValid).toBe(false);
      });
    });
  });

  describe("getUserById", () => {
    describe("valid retrieval", () => {
      it("should return user with id, email, created_at", async () => {
        const email = "test@example.com";
        const password = "password123";

        const signupResult = await AuthService.signup(email, password);

        const user = AuthService.getUserById(signupResult.id);

        expect(user).toBeDefined();
        expect(user).toEqual({
          id: signupResult.id,
          email: email,
          created_at: expect.any(String),
        });
      });

      it("should return created_at timestamp", async () => {
        const signupResult = await AuthService.signup(
          "test@example.com",
          "password123"
        );

        const user = AuthService.getUserById(signupResult.id);

        expect(user?.created_at).toBeDefined();
        expect(typeof user?.created_at).toBe("string");
      });
    });

    describe("invalid retrieval", () => {
      it("should return undefined for non-existent user", async () => {
        const user = AuthService.getUserById(99999);

        expect(user).toBeUndefined();
      });

      it("should return undefined for negative id", async () => {
        const user = AuthService.getUserById(-1);

        expect(user).toBeUndefined();
      });

      it("should return undefined for zero id", async () => {
        const user = AuthService.getUserById(0);

        expect(user).toBeUndefined();
      });
    });
  });

  describe("edge cases", () => {
    it("should accept password with special characters", async () => {
      const email = "test@example.com";
      const password = "p@$$w0rd!#%^&*()";

      const result = await AuthService.signup(email, password);
      expect(result.email).toBe(email);

      // Verify can login with special characters
      const loginResult = await AuthService.login(email, password);
      expect(loginResult.email).toBe(email);
    });

    it("should accept email with plus sign", async () => {
      const email = "test+alias@example.com";
      const password = "password123";

      const result = await AuthService.signup(email, password);
      expect(result.email).toBe(email);
    });

    it("should accept email with dots", async () => {
      const email = "test.user@example.com";
      const password = "password123";

      const result = await AuthService.signup(email, password);
      expect(result.email).toBe(email);
    });

    it("should handle very long password", async () => {
      const email = "test@example.com";
      const password = "a".repeat(100);

      const result = await AuthService.signup(email, password);
      expect(result.email).toBe(email);

      // Verify can login
      const loginResult = await AuthService.login(email, password);
      expect(loginResult.email).toBe(email);
    });

    it("should create multiple users successfully", async () => {
      const users = [
        { email: "user1@example.com", password: "password123" },
        { email: "user2@example.com", password: "password456" },
        { email: "user3@example.com", password: "password789" },
      ];

      const results = await Promise.all(
        users.map((u) => AuthService.signup(u.email, u.password))
      );

      expect(results).toHaveLength(3);
      expect(results[0].id).not.toBe(results[1].id);
      expect(results[1].id).not.toBe(results[2].id);

      // Verify all can login
      for (const user of users) {
        const loginResult = await AuthService.login(user.email, user.password);
        expect(loginResult.email).toBe(user.email);
      }
    });
  });
});
