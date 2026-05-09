// @vitest-environment jsdom
/**
 * Unit tests for Input component.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.6
 */
import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { Input } from "./input.tsx";

describe("Input", () => {
  // ── Base classes ───────────────────────────────────────────────────────

  it("wrapper has bg-white-a2 class", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-white-a2");
  });

  it("input has text-gray-12 class", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.className).toContain("text-gray-12");
  });

  it("input has placeholder:text-gray-a9 class", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.className).toContain("placeholder:text-gray-a9");
  });

  // ── Wrapper structure ──────────────────────────────────────────────────

  it("wrapper div has relative class for focus indicator positioning", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("relative");
  });

  // ── Input peer class ───────────────────────────────────────────────────

  it("input has peer class for focus indicator animation", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.className).toContain("peer");
  });

  // ── hasError={false} / omitted ─────────────────────────────────────────

  it("wrapper has border-b-gray-a10 class when hasError is omitted", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("border-b-gray-a10");
  });

  it("wrapper does NOT have border-b-danger-9 variant class when hasError is omitted", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    // The static has-data-invalid:border-b-danger-9 class is always present (CSS :has() selector),
    // but the variant-driven border-b-danger-9 class should not be present without hasError
    // We check that the plain border-b-danger-9 (without the has-data-invalid: prefix) is absent
    const classes = wrapper.className.split(" ");
    expect(classes).not.toContain("border-b-danger-9");
  });

  it("wrapper does NOT have border-b-danger-9 variant class when hasError={false}", () => {
    const { container } = render(<Input hasError={false} />);
    const wrapper = container.firstChild as HTMLElement;
    const classes = wrapper.className.split(" ");
    expect(classes).not.toContain("border-b-danger-9");
  });

  // ── hasError={true} ────────────────────────────────────────────────────

  it("wrapper has border-b-danger-9 class when hasError={true}", () => {
    const { container } = render(<Input hasError={true} />);
    const wrapper = container.firstChild as HTMLElement;
    const classes = wrapper.className.split(" ");
    expect(classes).toContain("border-b-danger-9");
  });

  // ── data-error attribute ───────────────────────────────────────────────

  it("input has data-error attribute when hasError={true}", () => {
    const { container } = render(<Input hasError={true} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.hasAttribute("data-error")).toBe(true);
  });

  it("input does NOT have data-error attribute when hasError={false}", () => {
    const { container } = render(<Input hasError={false} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.hasAttribute("data-error")).toBe(false);
  });

  it("input does NOT have data-error attribute when hasError is omitted", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.hasAttribute("data-error")).toBe(false);
  });

  // ── Disabled state ─────────────────────────────────────────────────────

  it("wrapper has has-disabled:opacity-50 class", () => {
    const { container } = render(<Input disabled />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("has-disabled:opacity-50");
  });

  it("wrapper has has-disabled:cursor-not-allowed class", () => {
    const { container } = render(<Input disabled />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("has-disabled:cursor-not-allowed");
  });

  // ── ref forwarding ─────────────────────────────────────────────────────

  it("forwards ref to the underlying <input> element (React 19 pattern)", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<Input ref={ref} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(ref.current).toBe(input);
  });

  // ── data-invalid attribute (Radix Form integration) ────────────────────

  it("wrapper always has has-data-invalid:border-b-danger-9 class (static CSS :has() selector)", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("has-data-invalid:border-b-danger-9");
  });

  // ── before adornment ───────────────────────────────────────────────────

  it("renders before adornment content before the input", () => {
    const { container } = render(<Input before={<span>$</span>} />);
    const wrapper = container.firstChild as HTMLElement;
    const children = Array.from(wrapper.children);
    const beforeSpan = children.find((el) => el.textContent === "$");
    expect(beforeSpan).toBeDefined();
    // Verify it appears before the input
    const inputIndex = children.findIndex((el) => el.tagName.toLowerCase() === "input");
    const beforeIndex = children.indexOf(beforeSpan!);
    expect(beforeIndex).toBeLessThan(inputIndex);
  });

  it("does not render before slot when before prop is omitted", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    // Only input + indicator span should be present (no extra before span)
    const spans = Array.from(wrapper.querySelectorAll("span"));
    // The indicator span is aria-hidden; no other spans should exist
    const nonIndicatorSpans = spans.filter(
      (s) => !s.hasAttribute("aria-hidden"),
    );
    expect(nonIndicatorSpans).toHaveLength(0);
  });

  // ── after adornment ────────────────────────────────────────────────────

  it("renders after adornment content after the input", () => {
    const { container } = render(<Input after={<span>kg</span>} />);
    const wrapper = container.firstChild as HTMLElement;
    const children = Array.from(wrapper.children);
    const afterSpan = children.find((el) => el.textContent === "kg");
    expect(afterSpan).toBeDefined();
    // Verify it appears after the input
    const inputIndex = children.findIndex((el) => el.tagName.toLowerCase() === "input");
    const afterIndex = children.indexOf(afterSpan!);
    expect(afterIndex).toBeGreaterThan(inputIndex);
  });

  it("does not render after slot when after prop is omitted", () => {
    const { container } = render(<Input />);
    const wrapper = container.firstChild as HTMLElement;
    const spans = Array.from(wrapper.querySelectorAll("span"));
    const nonIndicatorSpans = spans.filter(
      (s) => !s.hasAttribute("aria-hidden"),
    );
    expect(nonIndicatorSpans).toHaveLength(0);
  });
});
