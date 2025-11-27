import { describe, it, expect, vi, beforeEach } from "vitest";
import translate from "./translate.js";

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

describe("translate", () => {
  const mockText = "Hello world";
  const mockSourceLang = "English";
  const mockTargetLang = "French";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should successfully translate text and return parsed JSON", async () => {
    const mockResponse = {
      source_language: "English",
      target_language: "French",
      original_text: "Hello world",
      sentences: [
        {
          id: 1,
          source_sentence: "Hello world",
          target_sentence: "Bonjour le monde",
          items: [
            { order: 1, source: "Hello", target: "Bonjour" },
            { order: 2, source: "world", target: "monde" },
          ],
        },
      ],
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockResponse),
          },
        },
      ],
      usage: { total_tokens: 100 },
    });

    const result = await translate(mockText, mockSourceLang, mockTargetLang);

    expect(result.choice).toEqual(mockResponse);
    expect(result.usage).toEqual({ total_tokens: 100 });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
      })
    );
  });

  it("should handle markdown code blocks in response", async () => {
    const mockResponse = {
      source_language: "English",
      target_language: "French",
      original_text: "Hello",
      sentences: [],
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify(mockResponse) + "\n```",
          },
        },
      ],
      usage: { total_tokens: 50 },
    });

    const result = await translate(mockText, mockSourceLang, mockTargetLang);

    expect(result.choice).toEqual(mockResponse);
  });
});
