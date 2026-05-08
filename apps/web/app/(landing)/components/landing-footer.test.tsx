/**
 * Unit tests for LandingFooter component.
 * Requirements: 5.1, 5.2
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { LandingFooter } from "./landing-footer.tsx";

describe("LandingFooter", () => {
  it("renders a <footer> element", () => {
    const html = renderToString(<LandingFooter />);
    expect(html).toContain("<footer");
  });

  it("renders the current year in the copyright notice (requirement 5.1)", () => {
    const html = renderToString(<LandingFooter />);
    const currentYear = new Date().getFullYear().toString();
    expect(html).toContain(currentYear);
  });

  it("renders 'MiniSlack' in the copyright notice (requirement 5.1)", () => {
    const html = renderToString(<LandingFooter />);
    expect(html).toContain("MiniSlack");
  });

  it("footer has border-t class for visual separation (requirement 5.2)", () => {
    const html = renderToString(<LandingFooter />);
    // The border-t class should appear in the footer's class attribute
    expect(html).toMatch(/class="[^"]*border-t[^"]*"/);
  });
});
