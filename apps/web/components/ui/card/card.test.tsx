// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./card.tsx";

describe("Card", () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("has role='group' by default", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByRole("group")).toBeDefined();
  });

  it("accepts a custom role", () => {
    render(<Card role="region" aria-label="content" />);
    expect(screen.getByRole("region")).toBeDefined();
  });

  it("forwards ref to the div element", () => {
    let capturedRef: HTMLDivElement | null = null;
    render(<Card ref={(el) => { capturedRef = el; }} data-testid="card" />);
    expect(capturedRef).not.toBeNull();
    expect(capturedRef).toBe(screen.getByTestId("card"));
  });

  it("passes through HTML attributes", () => {
    render(<Card data-testid="card" aria-label="content card" />);
    expect(screen.getByTestId("card").getAttribute("aria-label")).toBe("content card");
  });

  // ── Appearance variants ──────────────────────────────────────────────────

  it("renders 'filled' appearance (default)", () => {
    render(<Card data-testid="card" />);
    const el = screen.getByTestId("card");
    expect(el.className).toContain("bg-gray-2");
    expect(el.className).toContain("shadow-sm");
  });

  it("renders 'filled-alternative' appearance", () => {
    render(<Card data-testid="card" appearance="filled-alternative" />);
    expect(screen.getByTestId("card").className).toContain("bg-gray-3");
  });

  it("renders 'outline' appearance with transparent background", () => {
    render(<Card data-testid="card" appearance="outline" />);
    const el = screen.getByTestId("card");
    expect(el.className).toContain("bg-transparent");
    expect(el.className).not.toContain("shadow-sm");
  });

  it("renders 'subtle' appearance with no border", () => {
    render(<Card data-testid="card" appearance="subtle" />);
    const el = screen.getByTestId("card");
    expect(el.className).toContain("border-transparent");
    expect(el.className).toContain("bg-transparent");
  });

  // ── Size variants ────────────────────────────────────────────────────────

  it("applies small size (8px token)", () => {
    render(<Card data-testid="card" size="small" />);
    expect(screen.getByTestId("card").className).toContain("[--card-size:8px]");
  });

  it("applies medium size (12px token, default)", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card").className).toContain("[--card-size:12px]");
  });

  it("applies large size (16px token)", () => {
    render(<Card data-testid="card" size="large" />);
    expect(screen.getByTestId("card").className).toContain("[--card-size:16px]");
  });

  // ── Orientation ──────────────────────────────────────────────────────────

  it("is vertical by default", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card").className).toContain("flex-col");
  });

  it("applies horizontal orientation", () => {
    render(<Card data-testid="card" orientation="horizontal" />);
    expect(screen.getByTestId("card").className).toContain("flex-row");
  });

  // ── Selected state ───────────────────────────────────────────────────────

  it("applies selected styles when selected=true", () => {
    render(<Card data-testid="card" selected />);
    const el = screen.getByTestId("card");
    expect(el.className).toContain("border-accent-8");
    expect(el.dataset.selected).toBe("true");
  });

  it("does not apply selected styles when selected=false", () => {
    render(<Card data-testid="card" selected={false} />);
    const el = screen.getByTestId("card");
    expect(el.dataset.selected).toBeUndefined();
  });

  // ── Disabled state ───────────────────────────────────────────────────────

  it("sets aria-disabled when disabled=true", () => {
    render(<Card data-testid="card" disabled />);
    const el = screen.getByTestId("card");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    expect(el.dataset.disabled).toBe("true");
  });

  it("applies opacity-50 when disabled", () => {
    render(<Card data-testid="card" disabled />);
    expect(screen.getByTestId("card").className).toContain("opacity-50");
  });

  it("does not set aria-disabled when disabled=false", () => {
    render(<Card data-testid="card" disabled={false} />);
    expect(screen.getByTestId("card").getAttribute("aria-disabled")).toBeNull();
  });

  // ── className merging ────────────────────────────────────────────────────

  it("merges custom className with base styles", () => {
    render(<Card data-testid="card" className="mt-4" />);
    const el = screen.getByTestId("card");
    expect(el.className).toContain("mt-4");
    expect(el.className).toContain("bg-gray-2");
  });
});
