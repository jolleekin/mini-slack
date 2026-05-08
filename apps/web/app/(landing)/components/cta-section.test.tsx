/**
 * Unit tests for CtaSection component.
 * Requirements: 4.1, 4.2, 4.3
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CtaSection } from "./cta-section.tsx";

describe("CtaSection", () => {
  it("renders an <h2> element", () => {
    const html = renderToString(<CtaSection />);
    expect(html).toContain("<h2");
  });

  it("renders a link with href='/signin'", () => {
    const html = renderToString(<CtaSection />);
    expect(html).toContain('href="/signin"');
  });

  it("section element has a violet/accent background in its class list (requirement 4.3)", () => {
    const html = renderToString(<CtaSection />);
    // The section should have a contrasting violet/accent background
    // Implementation uses a gradient: bg-linear-135 from-accent-9 to-accent-11
    // This satisfies requirement 4.3 for visual distinction
    const hasAccentBackground = 
      html.includes("bg-violet-9") || 
      html.includes("from-accent-9") ||
      html.includes("bg-accent-9");
    expect(hasAccentBackground).toBe(true);
  });
});
