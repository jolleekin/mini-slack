/**
 * Unit tests for HeroSection component.
 * Requirements: 2.1, 2.2
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroSection, HeroSectionProps } from "./hero-section.tsx";

const defaultProps: HeroSectionProps = {
  eyebrowLabel: "Now in beta",
  headline: "Team messaging without the noise",
  subheadline:
    "A fast, focused messaging app for small teams. Real-time channels, workspaces, and file sharing — built to keep your team in sync.",
  ctaLabel: "Get started",
  signinHref: "/en/signin",
};

describe("HeroSection", () => {
  it("renders an <h1> element", () => {
    const html = renderToString(<HeroSection {...defaultProps} />);
    expect(html).toContain("<h1");
  });

  it("renders a link with href='/en/signin'", () => {
    const html = renderToString(<HeroSection {...defaultProps} />);
    expect(html).toContain('href="/en/signin"');
  });

  it("renders the screenshot placeholder <div> with aria-hidden='true'", () => {
    const html = renderToString(<HeroSection {...defaultProps} />);
    // The screenshot placeholder should have aria-hidden="true"
    expect(html).toContain('aria-hidden="true"');
    // Verify it's a div element with aria-hidden
    expect(html).toMatch(/<div[^>]*aria-hidden="true"[^>]*>/);
  });

  it("renders the eyebrowLabel prop", () => {
    const html = renderToString(
      <HeroSection {...defaultProps} eyebrowLabel="Coming soon" />,
    );
    expect(html).toContain("Coming soon");
  });

  it("renders the headline prop", () => {
    const html = renderToString(
      <HeroSection {...defaultProps} headline="Test headline" />,
    );
    expect(html).toContain("Test headline");
  });

  it("renders the subheadline prop", () => {
    const html = renderToString(
      <HeroSection {...defaultProps} subheadline="Test subheadline" />,
    );
    expect(html).toContain("Test subheadline");
  });

  it("renders the ctaLabel prop in the CTA button", () => {
    const html = renderToString(
      <HeroSection {...defaultProps} ctaLabel="Start now" />,
    );
    expect(html).toContain("Start now");
  });
});
