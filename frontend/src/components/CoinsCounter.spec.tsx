import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CoinsCounter } from "./CoinsCounter";
import * as CoinContext from "../context/CoinContext";

describe("CoinsCounter", () => {
  it("renders nothing when total is null", () => {
    vi.spyOn(CoinContext, "useCoin").mockReturnValue({
      total: null,
      increment: vi.fn(),
      refresh: vi.fn(),
    });

    const { container } = render(<CoinsCounter />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the coin count when total is a number", () => {
    vi.spyOn(CoinContext, "useCoin").mockReturnValue({
      total: 42,
      increment: vi.fn(),
      refresh: vi.fn(),
    });

    const { container } = render(<CoinsCounter />);
    expect(screen.getByText("42")).toBeInTheDocument();
    // Check for the CoinIcon SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
