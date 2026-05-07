// @vitest-environment jsdom
/**
 * Unit tests for Spinner component.
 * Requirements: 1.6
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "@/components/ui/spinner";

describe("Spinner", () => {
  it('has role="status" for accessibility', () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders visually-hidden loading text for screen readers", () => {
    render(<Spinner />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("has data-spinner attribute on the root element", () => {
    render(<Spinner />);
    const statusEl = screen.getByRole("status");
    expect(statusEl.hasAttribute("data-spinner")).toBe(true);
  });
});
