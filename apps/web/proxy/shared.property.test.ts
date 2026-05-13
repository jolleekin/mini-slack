/**
 * Property-based tests for proxy/shared.ts — detectLocale.
 *
 * Property 2: Locale detection always returns a supported locale
 * Property 3: Cookie locale takes priority over Accept-Language
 *
 * Validates: Requirements 2.2, 2.3, 2.5
 */

import { NextRequest } from "next/server";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { translationsLoaders } from "@/lib/i18n/landing/index.ts";
import { detectLocale } from "./shared.ts";

const BASE_URL = "http://localhost:3000";
const SUPPORTED_LOCALES = Object.keys(translationsLoaders) as string[];

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates an arbitrary string that may or may not be a valid locale. */
const arbitraryCookieLocale = fc.oneof(
  fc.constant(""),
  fc.constant("en"),
  fc.constant("fr"),
  fc.constant("de"),
  fc.constant("ja"),
  fc.string({ minLength: 0, maxLength: 10 }),
);

/** Generates an arbitrary Accept-Language header value. */
const arbitraryAcceptLanguage = fc.oneof(
  fc.constant(""),
  fc.constant("en"),
  fc.constant("fr"),
  fc.constant("de"),
  fc.constant("en-US,en;q=0.9"),
  fc.constant("fr-FR,fr;q=0.9,en;q=0.8"),
  fc.string({ minLength: 0, maxLength: 30 }),
);

/** Generates a supported locale value. */
const supportedLocaleArb = fc.constantFrom(...SUPPORTED_LOCALES);

function makeRequest(options: {
  localeCookie?: string;
  acceptLanguage?: string;
}): NextRequest {
  const url = new URL("/app/workspaces", BASE_URL);
  const headers = new Headers();

  if (options.localeCookie !== undefined && options.localeCookie !== "") {
    headers.set("cookie", `locale=${options.localeCookie}`);
  }
  if (options.acceptLanguage !== undefined && options.acceptLanguage !== "") {
    headers.set("Accept-Language", options.acceptLanguage);
  }

  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// Property 2: Locale detection always returns a supported locale
// Validates: Requirements 2.2, 2.5
// ---------------------------------------------------------------------------

describe("Property 2: Locale detection always returns a supported locale", () => {
  it(
    "returns a value that is a key of translationsLoaders for any request",
    () => {
      fc.assert(
        fc.property(
          arbitraryCookieLocale,
          arbitraryAcceptLanguage,
          (cookieLocale, acceptLanguage) => {
            const request = makeRequest({ localeCookie: cookieLocale, acceptLanguage });
            const result = detectLocale(request);

            expect(SUPPORTED_LOCALES).toContain(result);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 3: Cookie locale takes priority over Accept-Language
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------

describe("Property 3: Cookie locale takes priority over Accept-Language", () => {
  it(
    "returns the cookie locale regardless of Accept-Language when cookie is a supported locale",
    () => {
      fc.assert(
        fc.property(
          supportedLocaleArb,
          arbitraryAcceptLanguage,
          (cookieLocale, acceptLanguage) => {
            const request = makeRequest({ localeCookie: cookieLocale, acceptLanguage });
            const result = detectLocale(request);

            expect(result).toBe(cookieLocale);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
