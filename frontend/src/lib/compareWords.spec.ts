import { describe, it, expect } from "vitest";
import { compareWords } from "./compareWords";

describe("compareWords", () => {
  it("returns correct status for exact match", () => {
    const result = compareWords("hello world", "hello world");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "hello", status: "correct" });
    expect(result[1]).toEqual({ word: "world", status: "correct" });
  });

  it("returns wrong status for completely different words", () => {
    const result = compareWords("hello", "bye");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ word: "bye", status: "wrong" });
  });

  it("returns almost status for close matches", () => {
    // "helo" is close to "hello"
    const result = compareWords("hello", "helo");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ word: "helo", status: "almost" });
  });

  it("handles insertions (extra words in transcript)", () => {
    const result = compareWords("hello world", "hello beautiful world");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ word: "hello", status: "correct" });
    expect(result[1]).toEqual({ word: "beautiful", status: "wrong" });
    expect(result[2]).toEqual({ word: "world", status: "correct" });
  });

  it("handles deletions (missing words in transcript)", () => {
    // "world" is missing from transcript, so it shouldn't appear in result
    const result = compareWords("hello beautiful world", "hello world");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "hello", status: "correct" });
    expect(result[1]).toEqual({ word: "world", status: "correct" });
  });

  it("handles substitutions", () => {
    const result = compareWords("hello world", "hello there");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "hello", status: "correct" });
    expect(result[1]).toEqual({ word: "there", status: "wrong" });
  });

  it("handles mixed cases and punctuation", () => {
    const result = compareWords("Hello, world!", "hello world");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "hello", status: "correct" });
    expect(result[1]).toEqual({ word: "world", status: "correct" });
  });

  it("handles empty transcript", () => {
    const result = compareWords("hello world", "");
    expect(result).toHaveLength(0);
  });
});
