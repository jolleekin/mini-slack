// @vitest-environment jsdom
/**
 * Unit tests for LandingFooter component.
 * Requirements: 5.1, 5.2
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LandingFooter } from "./landing-footer.tsx";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en",
}));

const defaultProps = {
  copyright: `© ${new Date().getFullYear()} MiniSlack`,
  currentLocale: "en" as const,
  localeSwitcherLabel: "Language",
  supportedLocales: ["en" as const],
};

describe("LandingFooter", () => {
  it("renders a <footer> element", () => {
    const { container } = render(<LandingFooter {...defaultProps} />);
    expect(container.querySelector("footer")).not.toBeNull();
  });

  it("renders the current year in the copyright notice (requirement 5.1)", () => {
    const { container } = render(<LandingFooter {...defaultProps} />);
    const currentYear = new Date().getFullYear().toString();
    expect(container.textContent).toContain(currentYear);
  });

  it("renders 'MiniSlack' in the copyright notice (requirement 5.1)", () => {
    const { container } = render(<LandingFooter {...defaultProps} />);
    expect(container.textContent).toContain("MiniSlack");
  });

  it("footer has border-t class for visual separation (requirement 5.2)", () => {
    const { container } = render(<LandingFooter {...defaultProps} />);
    const footer = container.querySelector("footer");
    expect(footer?.className).toMatch(/border-t/);
  });

  it("renders the copyright prop text", () => {
    const { container } = render(
      <LandingFooter {...defaultProps} copyright="© 2025 TestCo" />,
    );
    expect(container.textContent).toContain("© 2025 TestCo");
  });
});
