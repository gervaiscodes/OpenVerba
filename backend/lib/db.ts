import Database from "better-sqlite3";

// Initialize SQLite database
// Note: Path is relative to the process CWD, which is expected to be the backend directory
const db = new Database("database.db");

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_word TEXT NOT NULL,
    target_word TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    audio_url TEXT,
    UNIQUE(source_word, source_language, target_language)
  );

  CREATE TABLE IF NOT EXISTS sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_id INTEGER NOT NULL,
    order_in_text INTEGER NOT NULL,
    source_sentence TEXT NOT NULL,
    target_sentence TEXT NOT NULL,
    audio_url TEXT,
    FOREIGN KEY (text_id) REFERENCES texts(id)
  );

  CREATE TABLE IF NOT EXISTS sentence_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sentence_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    order_in_sentence INTEGER NOT NULL,
    FOREIGN KEY (sentence_id) REFERENCES sentences(id),
    FOREIGN KEY (word_id) REFERENCES words(id)
  );
`;

// Create database schema
db.exec(SCHEMA);

export default db;
