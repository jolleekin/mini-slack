// @vitest-environment jsdom
/**
 * Unit tests for Button component.
 * Requirements: 1.1, 1.2, 1.3, 1.8, 1.9
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./button.tsx";

describe("Button", () => {
  // ── Appearance variants ────────────────────────────────────────────────

  it('renders "default" appearance without error', () => {
    render(<Button appearance="default">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it('renders "primary" appearance without error', () => {
    render(<Button appearance="primary">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it('renders "outline" appearance without error', () => {
    render(<Button appearance="outline">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it('renders "subtle" appearance without error', () => {
    render(<Button appearance="subtle">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it('renders "transparent" appearance without error', () => {
    render(<Button appearance="transparent">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it('renders "link" appearance without error', () => {
    render(<Button appearance="link">Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  // ── asChild ────────────────────────────────────────────────────────────

  it("renders as child element type when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    // Should render as <a>, not <button>
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link")).toBeDefined();
  });

  it("renders as <button> by default (asChild=false)", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button")).toBeDefined();
  });

  // ── Focus ring ─────────────────────────────────────────────────────────

  it("has fluent-focus-ring class in the rendered output", () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("fluent-focus-ring");
  });

  // ── Size heights ───────────────────────────────────────────────────────

  it('has h-6 class for size="sm"', () => {
    render(<Button size="sm">Click</Button>);
    expect(screen.getByRole("button").className).toContain("h-6");
  });

  it('has h-8 class for size="default"', () => {
    render(<Button size="default">Click</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");
  });

  it('has h-10 class for size="lg"', () => {
    render(<Button size="lg">Click</Button>);
    expect(screen.getByRole("button").className).toContain("h-10");
  });

  it("has h-8 class when no size is specified (default)", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");
  });

  // ── isLoading ──────────────────────────────────────────────────────────

  it("renders a Spinner when isLoading is true", () => {
    render(<Button isLoading>Submit</Button>);
    // Spinner has role="status"
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("sets disabled attribute when isLoading is true", () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("does not render a Spinner when isLoading is false", () => {
    render(<Button isLoading={false}>Submit</Button>);
    expect(screen.queryByRole("status")).toBeNull();
  });

  // ── disabled ───────────────────────────────────────────────────────────

  it("sets disabled attribute when disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
