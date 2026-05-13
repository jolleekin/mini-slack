/**
 * Unit tests for CtaSection component.
 * Requirements: 4.1, 4.2, 4.3
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CtaSection, CtaSectionProps } from "./cta-section.tsx";

const defaultProps: CtaSectionProps = {
  headline: "Ready to bring your team together?",
  subheadline:
    "Get started in seconds — no credit card required. Just sign in and create your first workspace.",
  ctaLabel: "Get started",
  signinHref: "/en/signin",
};

describe("CtaSection", () => {
  it("renders an <h2> element", () => {
    const html = renderToString(<CtaSection {...defaultProps} />);
    expect(html).toContain("<h2");
  });

  it("renders a link with href='/en/signin'", () => {
    const html = renderToString(<CtaSection {...defaultProps} />);
    expect(html).toContain('href="/en/signin"');
  });

  it("section element has a violet/accent background in its class list (requirement 4.3)", () => {
    const html = renderToString(<CtaSection {...defaultProps} />);
    // The section should have a contrasting violet/accent background
    // Implementation uses a gradient: bg-linear-135 from-accent-9 to-accent-11
    // This satisfies requirement 4.3 for visual distinction
    const hasAccentBackground =
      html.includes("bg-violet-9") ||
      html.includes("from-accent-9") ||
      html.includes("bg-accent-9");
    expect(hasAccentBackground).toBe(true);
  });

  it("renders the headline prop", () => {
    const html = renderToString(
      <CtaSection {...defaultProps} headline="Join us today" />,
    );
    expect(html).toContain("Join us today");
  });

  it("renders the subheadline prop", () => {
    const html = renderToString(
      <CtaSection {...defaultProps} subheadline="No signup required" />,
    );
    expect(html).toContain("No signup required");
  });

  it("renders the ctaLabel prop in the CTA button", () => {
    const html = renderToString(
      <CtaSection {...defaultProps} ctaLabel="Sign up free" />,
    );
    expect(html).toContain("Sign up free");
  });
});
