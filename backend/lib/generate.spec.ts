import { describe, it, expect, vi, beforeEach } from "vitest";
import generate from "./generate.js";

// Mock OpenAI
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

vi.mock("openai", () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe("generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should successfully generate text", async () => {
    const mockKnownWords = ["apple", "banana"];
    const mockNewWordsPercentage = 20;
    const mockSourceLanguage = "Spanish";
    const mockGeneratedText = "Hola mundo. Esto es una prueba.";

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedText,
          },
        },
      ],
    });

    const result = await generate(
      mockKnownWords,
      mockNewWordsPercentage,
      mockSourceLanguage
    );

    expect(result).toBe(mockGeneratedText);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Verify prompt construction
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4o-mini");
    expect(callArgs.messages[1].content).toContain(mockSourceLanguage);
    expect(callArgs.messages[1].content).toContain(mockKnownWords.join(", "));
    expect(callArgs.messages[1].content).toContain(
      mockNewWordsPercentage.toString()
    );
  });

  it("should truncate known words list if it exceeds 500 items", async () => {
    const manyWords = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const mockNewWordsPercentage = 10;
    const mockSourceLanguage = "French";

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Generated text" } }],
    });

    await generate(manyWords, mockNewWordsPercentage, mockSourceLanguage);

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[1].content;

    // Should contain the first 500 words
    expect(promptContent).toContain("word0");
    expect(promptContent).toContain("word499");
    // Should NOT contain the 501st word
    expect(promptContent).not.toContain("word500");
  });

  it("should handle empty response from OpenAI", async () => {
    mockCreate.mockResolvedValue({
      choices: [],
    });

    const result = await generate([], 10, "English");
    expect(result).toBe("");
  });
});
