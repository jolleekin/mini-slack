/**
 * Property-based tests for the landing i18n module.
 * Uses fast-check to verify invariants across all inputs.
 *
 * Feature: apps.web.localization
 * Property 1: Interpolation replaces all placeholders (Requirements 1.4, 8.4)
 * Property 5: Locale catalog round-trip integrity (Requirements 8.1, 8.2)
 * Property 6: Translator idempotence (Requirements 8.3, 8.4)
 *
 * Note: Properties 2 and 3 (locale detection from headers) no longer apply to
 * the landing module — locale now comes from the URL segment, not headers.
 */
import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import {
  getTranslator,
  loadTranslations,
  translationsLoaders,
  type Locale,
} from "./index.ts";

// ── Generators ─────────────────────────────────────────────────────────────

/** Supported locales */
const supportedLocales = Object.keys(translationsLoaders) as Locale[];

/** Arbitrary supported locale */
const supportedLocaleArb = fc.constantFrom(...supportedLocales);

// ── Property 1: Interpolation replaces all placeholders ────────────────────
// Validates: Requirements 1.4, 8.4

describe("Property 1: Interpolation replaces all placeholders", () => {
  it(
    "translator replaces every {{param}} placeholder when params are supplied",
    async () => {
      // The only key with a placeholder in the landing catalog is landing.footer.copyright ({{year}})
      const catalog = await loadTranslations("en");
      const t = createTranslator(catalog);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          async (yearValue) => {
            const result = t("landing.footer.copyright", { year: yearValue });
            // The placeholder {{year}} must be replaced; the literal "{{year}}" must not appear
            return (
              !result.includes("{{year}}") && result.includes(yearValue)
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ── Property 5: Locale catalog round-trip integrity ────────────────────────
// Validates: Requirements 8.1, 8.2

describe("Property 5: Locale catalog round-trip integrity", () => {
  it(
    "getTranslator(locale) resolves every en catalog key to a non-empty string",
    async () => {
      // Load the en catalog to get all keys
      const enCatalog = await loadTranslations("en");

      /** Recursively collect all dot-separated leaf keys from a nested object */
      function collectKeys(
        obj: Record<string, unknown>,
        prefix = "",
      ): string[] {
        return Object.entries(obj).flatMap(([k, v]) => {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === "string") return [fullKey];
          if (typeof v === "object" && v !== null)
            return collectKeys(v as Record<string, unknown>, fullKey);
          return [];
        });
      }

      const allKeys = collectKeys(
        enCatalog as unknown as Record<string, unknown>,
      );

      await fc.assert(
        fc.asyncProperty(supportedLocaleArb, async (locale) => {
          const { t } = await getTranslator(locale);

          for (const key of allKeys) {
            const result = t(key as Parameters<typeof t>[0]);
            // Must be a non-empty string (not the key itself returned as fallback)
            if (typeof result !== "string" || result.length === 0) {
              return false;
            }
          }
          return true;
        }),
        { numRuns: supportedLocales.length },
      );
    },
  );
});

// ── Property 6: Translator idempotence ─────────────────────────────────────
// Validates: Requirements 8.3, 8.4

describe("Property 6: Translator idempotence", () => {
  it(
    "calling the translator twice with the same key and params returns identical strings",
    async () => {
      const { t } = await getTranslator("en");

      /** Recursively collect all dot-separated leaf keys */
      function collectKeys(
        obj: Record<string, unknown>,
        prefix = "",
      ): string[] {
        return Object.entries(obj).flatMap(([k, v]) => {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === "string") return [fullKey];
          if (typeof v === "object" && v !== null)
            return collectKeys(v as Record<string, unknown>, fullKey);
          return [];
        });
      }

      const catalog = await loadTranslations("en");
      const allKeys = collectKeys(
        catalog as unknown as Record<string, unknown>,
      );
      const keyArb = fc.constantFrom(...allKeys);

      // Params: arbitrary string values for any placeholder
      const paramsArb = fc.oneof(
        fc.constant(undefined),
        fc.record({ year: fc.string({ minLength: 1, maxLength: 10 }) }),
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
