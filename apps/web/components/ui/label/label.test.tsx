// @vitest-environment jsdom
/**
 * Unit tests for Label component.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.2, 5.3, 5.4
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "@/components/ui/label/label.tsx";

describe("Label", () => {
  // ── Root element ───────────────────────────────────────────────────────

  it("renders a <label> element as the root node", () => {
    render(<Label>Name</Label>);
    const el = screen.getByText("Name");
    expect(el.tagName.toLowerCase()).toBe("label");
  });

  // ── Base classes ───────────────────────────────────────────────────────

  it("always has text-gray-12 class", () => {
    render(<Label>Name</Label>);
    expect(screen.getByText("Name").className).toContain("text-gray-12");
  });

  it("always has font-medium class", () => {
    render(<Label>Name</Label>);
    expect(screen.getByText("Name").className).toContain("font-medium");
  });

  // ── htmlFor ────────────────────────────────────────────────────────────

  it("forwards htmlFor to the underlying <label> element", () => {
    render(<Label htmlFor="email">Email</Label>);
    const el = screen.getByText("Email");
    expect(el.getAttribute("for")).toBe("email");
  });

  // ── Custom className ───────────────────────────────────────────────────

  it("merges custom className with base styles", () => {
    render(<Label className="my-custom-class">Name</Label>);
    const el = screen.getByText("Name");
    expect(el.className).toContain("my-custom-class");
    expect(el.className).toContain("text-gray-12");
    expect(el.className).toContain("font-medium");
  });

  // ── required prop ──────────────────────────────────────────────────────

  it('renders an asterisk with text-danger-9 when required={true}', () => {
    render(<Label required={true}>Name</Label>);
    const indicator = screen.getByText("*");
    expect(indicator).toBeDefined();
    expect(indicator.className).toContain("text-danger-9");
  });

  it('renders the custom string when required="(required)"', () => {
    render(<Label required="(required)">Name</Label>);
    expect(screen.getByText("(required)")).toBeDefined();
  });

  it("renders a custom JSX element when required is a JSX element", () => {
    render(<Label required={<span>custom</span>}>Name</Label>);
    expect(screen.getByText("custom")).toBeDefined();
  });

  it("renders no required indicator when required={false}", () => {
    render(<Label required={false}>Name</Label>);
    expect(screen.queryByText("*")).toBeNull();
  });

  it("renders no required indicator when required prop is omitted", () => {
    render(<Label>Name</Label>);
    expect(screen.queryByText("*")).toBeNull();
  });

  // ── disabled prop ──────────────────────────────────────────────────────

  it("applies opacity-50 and cursor-not-allowed when disabled={true}", () => {
    render(<Label disabled={true}>Name</Label>);
    const el = screen.getByText("Name");
    expect(el.className).toContain("opacity-50");
    expect(el.className).toContain("cursor-not-allowed");
  });

  it("does not apply opacity-50 or cursor-not-allowed when disabled={false}", () => {
    render(<Label disabled={false}>Name</Label>);
    const el = screen.getByText("Name");
    expect(el.className).not.toContain("opacity-50");
    expect(el.className).not.toContain("cursor-not-allowed");
  });

  it("does not apply opacity-50 or cursor-not-allowed when disabled prop is omitted", () => {
    render(<Label>Name</Label>);
    const el = screen.getByText("Name");
    expect(el.className).not.toContain("opacity-50");
    expect(el.className).not.toContain("cursor-not-allowed");
  });

  // ── size variants ──────────────────────────────────────────────────────

  it('applies text-xs when size="sm"', () => {
    render(<Label size="sm">Name</Label>);
    expect(screen.getByText("Name").className).toContain("text-xs");
  });

  it('applies text-sm when size="default"', () => {
    render(<Label size="default">Name</Label>);
    expect(screen.getByText("Name").className).toContain("text-sm");
  });

  it('applies text-base when size="lg"', () => {
    render(<Label size="lg">Name</Label>);
    expect(screen.getByText("Name").className).toContain("text-base");
  });

  it("defaults to text-sm when size prop is omitted", () => {
    render(<Label>Name</Label>);
    expect(screen.getByText("Name").className).toContain("text-sm");
  });
});
