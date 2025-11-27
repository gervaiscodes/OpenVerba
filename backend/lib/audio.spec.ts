import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AWS Polly
const { mockSend } = vi.hoisted(() => {
  return { mockSend: vi.fn() };
});

vi.mock("@aws-sdk/client-polly", () => {
  return {
    PollyClient: class MockPollyClient {
      send = mockSend;
    },
    SynthesizeSpeechCommand: class MockSynthesizeSpeechCommand {
      constructor(public args: any) {}
    },
  };
});

// Mock fs
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock path
vi.mock("path", () => ({
  default: {
    join: vi.fn((...args) => args.join("/")),
  },
  join: vi.fn((...args) => args.join("/")),
}));

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "mockedhash123"),
    })),
  },
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => "mockedhash123"),
  })),
}));

import { generateAudio } from "./audio.js";

describe("audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
  });

  describe("generateAudio", () => {
    it("should generate audio and return a URL", async () => {
      mockSend.mockResolvedValue({
        AudioStream: {
          transformToByteArray: async () => new Uint8Array([1, 2, 3]),
        },
      });

      const result = await generateAudio("Hello world", "en");

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result).toContain("/audio/");
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
