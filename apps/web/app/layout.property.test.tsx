// @vitest-environment jsdom
/**
 * Property-based test for the root layout.
 *
 * Feature: apps.web.localization, Property 4: HTML lang attribute reflects resolved locale
 * Validates: Requirements 4.1, 4.2, 4.3
 *
 * The root layout is an async Server Component that calls `headers()` from
 * `next/headers`. We mock `next/headers` to return a controllable Headers
 * object and verify that the rendered `<html>` element has the correct `lang`
 * attribute for every supported locale.
 */
import { describe, it, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { translationsLoaders, type Locale } from "@/lib/i18n/app/index.ts";

// Mock next/headers so the layout can be imported in a test environment
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// Mock next/font/google to avoid font loading in tests
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("Property 4: HTML lang attribute reflects resolved locale", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it(
    "renders <html> with lang equal to the resolved locale for every supported locale",
    async () => {
      const supportedLocales = Object.keys(translationsLoaders) as Locale[];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...supportedLocales),
          async (locale) => {
            // Re-import after resetModules to pick up fresh mock state
            const { headers } = await import("next/headers");
            vi.mocked(headers).mockReturnValue(
              new Headers({ cookie: `locale=${locale}` }) as any,
            );

            const { default: RootLayout } = await import("./layout.tsx");
            const { render } = await import("@testing-library/react");

            const { container } = render(
              await RootLayout({ children: <span>test</span> }),
            );

            // The rendered output contains the html element with lang attribute
            // Check both the document element (jsdom sets it) and the container HTML
            const htmlEl = document.documentElement;
            const langFromDoc = htmlEl.getAttribute("lang") === locale;
            const langFromContainer = container.innerHTML.includes(
              `lang="${locale}"`,
            );

            return langFromDoc || langFromContainer;
          },
        ),
        { numRuns: supportedLocales.length },
      );
    },
  );
});
