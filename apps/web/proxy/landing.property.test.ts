/**
 * Property-based tests for proxy/landing.ts.
 *
 * Property 7: Landing proxy always sets locale cookie
 * For any request to a /{locale}/* path with a valid locale, the landing proxy
 * response SHALL include a Set-Cookie header for the locale cookie equal to
 * the path segment value.
 *
 * Validates: Requirements 2.1, 2.2
 */

import { NextRequest } from "next/server";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { translationsLoaders } from "@/lib/i18n/landing/index.ts";
import { landingProxy } from "./landing.ts";

const BASE_URL = "http://localhost:3000";
const SUPPORTED_LOCALES = Object.keys(translationsLoaders) as string[];

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a supported locale. */
const supportedLocaleArb = fc.constantFrom(...SUPPORTED_LOCALES);

/** Generates an arbitrary path suffix (may be empty or have segments). */
const pathSuffixArb = fc.oneof(
  fc.constant(""),
  fc.constant("/signin"),
  fc.constant("/some/page"),
  fc
    .array(fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !s.includes("/")), {
      minLength: 0,
      maxLength: 3,
    })
    .map((parts) => (parts.length > 0 ? `/${parts.join("/")}` : "")),
);

function makeRequest(pathname: string): NextRequest {
  const url = new URL(pathname, BASE_URL);
  return new NextRequest(url);
}

function getSetCookieLocale(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/locale=([^;]+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Property 7: Landing proxy always sets locale cookie
// Validates: Requirements 2.1, 2.2
// ---------------------------------------------------------------------------

describe("Property 7: Landing proxy always sets locale cookie", () => {
  it(
    "sets locale cookie equal to the path segment value for any /{locale}/* request",
    () => {
      fc.assert(
        fc.property(supportedLocaleArb, pathSuffixArb, (locale, suffix) => {
          const pathname = `/${locale}${suffix}`;
          const request = makeRequest(pathname);
          const response = landingProxy(request);

          const cookieLocale = getSetCookieLocale(response);
          expect(cookieLocale).toBe(locale);
        }),
        { numRuns: 100 },
      );
    },
  );
});
