/**
 * Unit tests for LandingHeader component.
 * Requirements: 1.1, 1.2, 1.3
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { LandingHeader, LandingHeaderProps } from "./landing-header.tsx";

const defaultProps: LandingHeaderProps = {
  siteName: "MiniSlack",
  signInLabel: "Sign in",
  skipToContentLabel: "Skip to main content",
  signinHref: '/en/signin'
};

describe("LandingHeader", () => {
  it("renders a <header> element", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    expect(html).toContain("<header");
  });

  it("renders a <nav> element", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    expect(html).toContain("<nav");
  });

  it("renders a Sign in link pointing to /signin", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    expect(html).toContain('href="/en/signin"');
    expect(html).toContain("Sign in");
  });

  it("header has sticky class for sticky positioning (requirement 1.3)", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    // The sticky class should appear in the header's class attribute
    expect(html).toMatch(/class="[^"]*sticky[^"]*"/);
  });

  it("includes a skip-to-main-content link as the first focusable element", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
    // The skip link should appear before the nav
    const skipIndex = html.indexOf("#main-content");
    const navIndex = html.indexOf("<nav");
    expect(skipIndex).toBeLessThan(navIndex);
  });

  it("nav has aria-label for accessibility (requirement 7.1)", () => {
    const html = renderToString(<LandingHeader {...defaultProps} />);
    expect(html).toContain('aria-label="Main navigation"');
  });

  it("renders the siteName prop as the logo text", () => {
    const html = renderToString(<LandingHeader {...defaultProps} siteName="TestApp" />);
    expect(html).toContain("TestApp");
  });

  it("renders the signInLabel prop in the sign-in link", () => {
    const html = renderToString(<LandingHeader {...defaultProps} signInLabel="Log in" />);
    expect(html).toContain("Log in");
  });

  it("renders the skipToContentLabel prop in the skip link", () => {
    const html = renderToString(<LandingHeader {...defaultProps} skipToContentLabel="Skip navigation" />);
    expect(html).toContain("Skip navigation");
  });
});
