/**
 * Unit tests for LandingHeader component.
 * Requirements: 1.1, 1.2, 1.3
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { LandingHeader } from "@/app/(landing)/components/landing-header";

describe("LandingHeader", () => {
  it("renders a <header> element", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain("<header");
  });

  it("renders a <nav> element", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain("<nav");
  });

  it("renders a Sign in link pointing to /signin", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain('href="/signin"');
    expect(html).toContain("Sign in");
  });

  it("header has sticky class for sticky positioning (requirement 1.3)", () => {
    const html = renderToString(<LandingHeader />);
    // The sticky class should appear in the header's class attribute
    expect(html).toMatch(/class="[^"]*sticky[^"]*"/);
  });

  it("includes a skip-to-main-content link as the first focusable element", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
    // The skip link should appear before the nav
    const skipIndex = html.indexOf("#main-content");
    const navIndex = html.indexOf("<nav");
    expect(skipIndex).toBeLessThan(navIndex);
  });

  it("nav has aria-label for accessibility (requirement 7.1)", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain('aria-label="Main navigation"');
  });

  it("logo wordmark displays MiniSlack text", () => {
    const html = renderToString(<LandingHeader />);
    expect(html).toContain("MiniSlack");
  });
});
