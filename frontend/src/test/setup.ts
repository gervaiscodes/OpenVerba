import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

// Mock fetch globally to prevent hanging requests
beforeEach(() => {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  ) as any;
});
