import { describe, it, expect } from "vitest";
import { calculateSimilarity } from "./calculateSimilarity";

describe("calculateSimilarity", () => {
  it("returns 100 for identical strings", () => {
    expect(calculateSimilarity("hello", "hello")).toBe(100);
    expect(calculateSimilarity("Hello World", "hello world")).toBe(100);
  });

  it("returns 100 for strings that differ only in punctuation", () => {
    expect(calculateSimilarity("Hello, world!", "Hello world")).toBe(100);
    expect(calculateSimilarity("Yes; no?", "Yes no")).toBe(100);
  });

  it("returns 100 for strings that differ only in case", () => {
    expect(calculateSimilarity("HELLO", "hello")).toBe(100);
    expect(calculateSimilarity("Hello World", "HELLO WORLD")).toBe(100);
  });

  it("returns 0 when one string is empty", () => {
    expect(calculateSimilarity("", "hello")).toBe(0);
    expect(calculateSimilarity("hello", "")).toBe(0);
    expect(calculateSimilarity("", "")).toBe(100); // Both empty = identical
  });

  it("calculates similarity for similar strings", () => {
    // "hello" vs "helo" - 1 deletion, 80% similar
    const score1 = calculateSimilarity("hello", "helo");
    expect(score1).toBeGreaterThan(70);
    expect(score1).toBeLessThan(100);

    // "cat" vs "bat" - 1 substitution, 66% similar
    const score2 = calculateSimilarity("cat", "bat");
    expect(score2).toBeGreaterThan(60);
    expect(score2).toBeLessThan(100);
  });

  it("calculates similarity for completely different strings", () => {
    const score = calculateSimilarity("hello", "world");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(50);
  });

  it("handles strings with whitespace correctly", () => {
    expect(calculateSimilarity("  hello  ", "hello")).toBe(100);
    expect(calculateSimilarity("hello world", "helloworld")).toBeLessThan(100);
  });

  it("handles long sentences", () => {
    const sentence1 = "The quick brown fox jumps over the lazy dog";
    const sentence2 = "The quick brown fox jumps over the lazy dog";
    expect(calculateSimilarity(sentence1, sentence2)).toBe(100);

    const sentence3 = "The quick brown fox jumps over the lazy cat";
    const score = calculateSimilarity(sentence1, sentence3);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThan(100);
  });

  it("returns a score between 0 and 100", () => {
    const testCases = [
      ["hello", "world"],
      ["test", "testing"],
      ["abc", "xyz"],
      ["same", "same"],
      ["", "nonempty"],
    ];

    testCases.forEach(([str1, str2]) => {
      const score = calculateSimilarity(str1, str2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it("handles special characters and punctuation", () => {
    expect(calculateSimilarity("Hello!", "Hello")).toBe(100);
    expect(calculateSimilarity("What?", "What")).toBe(100);
    expect(calculateSimilarity("Yes, no.", "Yes no")).toBe(100);
  });
});
