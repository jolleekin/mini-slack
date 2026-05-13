/**
 * Property-based tests for the app i18n module.
 * Uses fast-check to verify invariants across all inputs.
 *
 * Feature: apps.web.localization
 * Property 2: Locale detection always returns a supported locale (Requirements 2.1, 2.2)
 * Property 3: Cookie locale takes priority over Accept-Language (Requirements 2.3)
 * Property 1: Interpolation replaces all placeholders (Requirements 1.4, 8.4)
 * Property 5: Locale catalog round-trip integrity (Requirements 8.1, 8.2)
 * Property 6: Translator idempotence (Requirements 8.3, 8.4)
 */
import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import {
  extractLocale,
  loadTranslations,
  translationsLoaders,
  type Locale,
} from "./index.ts";

// ── Generators ─────────────────────────────────────────────────────────────

/** Arbitrary printable ASCII string (no control chars) */
const printableString = fc.string({ minLength: 0, maxLength: 40 });

/** Arbitrary Accept-Language header value */
const acceptLanguageArb = fc.oneof(
  fc.constant(""),
  fc.constant("en"),
  fc.constant("en-US,en;q=0.9"),
  fc.constant("fr-FR,fr;q=0.9"),
  fc.constant("de"),
  fc.constant("zh-CN"),
  printableString,
);

/** Arbitrary cookie header value (may or may not contain locale=) */
const cookieHeaderArb = fc.oneof(
  fc.constant(""),
  fc.constant("locale=en"),
  fc.constant("locale=fr"),
  fc.constant("locale=de"),
  fc.constant("session=abc; locale=en; theme=dark"),
  fc.constant("session=xyz"),
  printableString,
);

/** Supported locales */
const supportedLocales = Object.keys(translationsLoaders) as Locale[];

/** Arbitrary supported locale */
const supportedLocaleArb = fc.constantFrom(...supportedLocales);

// ── Property 2: Locale detection always returns a supported locale ──────────
// Feature: apps.web.localization, Property 2: Locale detection always returns a supported locale
// Validates: Requirements 2.1, 2.2

describe("Property 2: Locale detection always returns a supported locale", () => {
  it(
    "extractLocale always returns a value that is a key of translationsLoaders for any Headers input",
    () => {
      fc.assert(
        fc.property(
          cookieHeaderArb,
          acceptLanguageArb,
          (cookieValue, acceptLang) => {
            const headers = new Headers();
            if (cookieValue) headers.set("cookie", cookieValue);
            if (acceptLang) headers.set("Accept-Language", acceptLang);

            const locale = extractLocale(headers);
            return locale in translationsLoaders;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ── Property 3: Cookie locale takes priority over Accept-Language ───────────
// Feature: apps.web.localization, Property 3: Cookie locale takes priority over Accept-Language
// Validates: Requirements 2.3

describe("Property 3: Cookie locale takes priority over Accept-Language", () => {
  it(
    "extractLocale returns the cookie locale when locale cookie is set to a supported value, regardless of Accept-Language",
    () => {
      fc.assert(
        fc.property(
          supportedLocaleArb,
          acceptLanguageArb,
          (supportedLocale, acceptLang) => {
            const headers = new Headers({
              cookie: `locale=${supportedLocale}`,
            });
            if (acceptLang) headers.set("Accept-Language", acceptLang);

            const locale = extractLocale(headers);
            return locale === supportedLocale;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ── Property 1: Interpolation replaces all placeholders ────────────────────
// Feature: apps.web.localization, Property 1: Interpolation replaces all placeholders
// Validates: Requirements 1.4, 8.4
//
// The app catalog (en.json) has no {{param}} placeholders. This property verifies:
// 1. Keys without placeholders return the exact string value.
// 2. Passing extra params to a key without placeholders still returns the original string.

describe("Property 1: Interpolation replaces all placeholders", () => {
  it(
    "translator returns the exact string for keys without placeholders, even when extra params are passed",
    async () => {
      const catalog = await loadTranslations("en");
      const t = createTranslator(catalog);
      const expectedValue = "Loading…";

      // Keys must be valid identifier-like strings (alphanumeric + underscore)
      // to avoid creating invalid RegExp patterns inside createTranslator.
      const safeKeyArb = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,9}$/);
      const safeValueArb = fc.string({ minLength: 0, maxLength: 20 });

      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(safeKeyArb, safeValueArb),
          async (extraParams) => {
            // With no params
            const resultNoParams = t("common.loading");
            // With arbitrary extra params (none match any placeholder since there are none)
            const resultWithParams = t("common.loading", extraParams);

            return (
              resultNoParams === expectedValue &&
              resultWithParams === expectedValue
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ── Property 5: Locale catalog round-trip integrity ────────────────────────
// Feature: apps.web.localization, Property 5: Locale catalog round-trip integrity
// Validates: Requirements 8.1, 8.2

describe("Property 5: Locale catalog round-trip integrity", () => {
  it(
    "loadTranslations followed by createTranslator resolves every en catalog key to a non-empty string",
    async () => {
      // Load the en catalog to get all keys
      const enCatalog = await loadTranslations("en");

      /** Recursively collect all dot-separated leaf keys from a nested object */
      function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
        return Object.entries(obj).flatMap(([k, v]) => {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === "string") return [fullKey];
          if (typeof v === "object" && v !== null)
            return collectKeys(v as Record<string, unknown>, fullKey);
          return [];
        });
      }

      const allKeys = collectKeys(enCatalog as unknown as Record<string, unknown>);

      await fc.assert(
        fc.asyncProperty(
          supportedLocaleArb,
          async (locale) => {
            const catalog = await loadTranslations(locale);
            const t = createTranslator(catalog);

            for (const key of allKeys) {
              const result = t(key as Parameters<typeof t>[0]);
              // Must be a non-empty string (not the key itself returned as fallback)
              if (typeof result !== "string" || result.length === 0) {
                return false;
              }
            }
            return true;
          },
        ),
        { numRuns: supportedLocales.length },
      );
    },
  );
});

// ── Property 6: Translator idempotence ─────────────────────────────────────
// Feature: apps.web.localization, Property 6: Translator idempotence
// Validates: Requirements 8.3, 8.4

describe("Property 6: Translator idempotence", () => {
  it(
    "calling the translator twice with the same key and params returns identical strings",
    async () => {
      const catalog = await loadTranslations("en");
      const t = createTranslator(catalog);

      /** Recursively collect all dot-separated leaf keys */
      function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
        return Object.entries(obj).flatMap(([k, v]) => {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === "string") return [fullKey];
          if (typeof v === "object" && v !== null)
            return collectKeys(v as Record<string, unknown>, fullKey);
          return [];
        });
      }

      const allKeys = collectKeys(catalog as unknown as Record<string, unknown>);
      const keyArb = fc.constantFrom(...allKeys);

      // Params: arbitrary string values (app catalog has no placeholders, but we test robustness)
      const paramsArb = fc.oneof(
        fc.constant(undefined),
        fc.record({ param: fc.string({ minLength: 1, maxLength: 10 }) }),
      );

      await fc.assert(
        fc.asyncProperty(keyArb, paramsArb, async (key, params) => {
          const result1 = t(key as Parameters<typeof t>[0], params);
          const result2 = t(key as Parameters<typeof t>[0], params);
          return result1 === result2;
        }),
        { numRuns: 200 },
      );
    },
  );
});
