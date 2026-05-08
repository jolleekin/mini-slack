/**
 * Unit tests for HeroSection component.
 * Requirements: 2.1, 2.2
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { HeroSection } from "./hero-section.tsx";

describe("HeroSection", () => {
  it("renders an <h1> element", () => {
    const html = renderToString(<HeroSection />);
    expect(html).toContain("<h1");
  });

  it("renders a link with href='/signin'", () => {
    const html = renderToString(<HeroSection />);
    expect(html).toContain('href="/signin"');
  });

  it("renders the screenshot placeholder <div> with aria-hidden='true'", () => {
    const html = renderToString(<HeroSection />);
    // The screenshot placeholder should have aria-hidden="true"
    expect(html).toContain('aria-hidden="true"');
    // Verify it's a div element with aria-hidden
    expect(html).toMatch(/<div[^>]*aria-hidden="true"[^>]*>/);
  });
});
