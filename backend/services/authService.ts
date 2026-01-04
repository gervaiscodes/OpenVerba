import db from "../lib/db.js";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  static async signup(email: string, password: string) {
    // Validate email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error("Invalid email format");
    }

    // Validate password
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Check if user exists
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase());

    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email.toLowerCase(), passwordHash);

    const userId = result.lastInsertRowid as number;

    return {
      id: userId,
      email: email.toLowerCase(),
    };
  }

  static async login(email: string, password: string) {
    const user = db
      .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
      .get(email.toLowerCase()) as
      | { id: number; email: string; password_hash: string }
      | undefined;

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      throw new Error("Invalid email or password");
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  static getUserById(userId: number) {
    const user = db
      .prepare("SELECT id, email, created_at FROM users WHERE id = ?")
      .get(userId) as
      | { id: number; email: string; created_at: string }
      | undefined;

    return user;
  }
}
