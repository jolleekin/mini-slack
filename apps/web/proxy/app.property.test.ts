/**
 * Property-based tests for proxy/app.ts.
 *
 * Property 8: App proxy redirects unauthenticated requests
 * For any unauthenticated request to /app/*, the app proxy SHALL return a
 * redirect response to /{locale}/signin?redirect=/app/...
 *
 * Validates: Requirements 10.3
 */

import { NextRequest } from "next/server";
import * as fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock auth before importing appProxy
vi.mock("@/lib/identity/auth.ts", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/identity/auth.ts";
import { translationsLoaders } from "@/lib/i18n/landing/index.ts";
import { appProxy } from "./app.ts";

const BASE_URL = "http://localhost:3000";
const SUPPORTED_LOCALES = Object.keys(translationsLoaders) as string[];

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates an arbitrary /app/* path suffix using URL-safe characters. */
const appPathSuffixArb = fc.oneof(
  fc.constant("/workspaces"),
  fc.constant("/settings/locale"),
  fc
    .array(
      fc
        .stringMatching(/^[a-zA-Z0-9_-]{1,10}$/)
        .filter((s) => s.length > 0),
      { minLength: 1, maxLength: 3 },
    )
    .map((parts) => `/${parts.join("/")}`),
);

/** Generates a supported locale. */
const supportedLocaleArb = fc.constantFrom(...SUPPORTED_LOCALES);

function makeRequest(
  pathname: string,
  options: { localeCookie?: string } = {},
): NextRequest {
  const url = new URL(pathname, BASE_URL);
  const headers = new Headers();

  if (options.localeCookie) {
    headers.set("cookie", `locale=${options.localeCookie}`);
  }

  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// Property 8: App proxy redirects unauthenticated requests
// Validates: Requirements 10.3
// ---------------------------------------------------------------------------

describe("Property 8: App proxy redirects unauthenticated requests", () => {
  it(
    "redirects to /{locale}/signin?redirect=/app/... for any unauthenticated /app/* request",
    async () => {
      mockGetSession.mockResolvedValue(null);

      await fc.assert(
        fc.asyncProperty(
          appPathSuffixArb,
          supportedLocaleArb,
          async (suffix, locale) => {
            const pathname = `/app${suffix}`;
            const request = makeRequest(pathname, { localeCookie: locale });
            const response = await appProxy(request);

            // Must be a redirect
            expect(response.status).toBeGreaterThanOrEqual(300);
            expect(response.status).toBeLessThan(400);

            const location = new URL(response.headers.get("location")!);

            // Redirect target must be /{locale}/signin
            expect(location.pathname).toBe(`/${locale}/signin`);

            // Must include redirect param pointing back to the original path
            const redirectParam = location.searchParams.get("redirect");
            expect(redirectParam).toBe(pathname);
          },
        ),
        { numRuns: 50 },
      );
    },
  );
});
