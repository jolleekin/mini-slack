/**
 * Unit tests for the landing i18n module.
 *
 * Feature: apps.web.localization
 * Validates: Requirements 2.1, 9.1
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getTranslator,
  isValidLocale,
  loadTranslations,
  translationsLoaders,
} from "./index.ts";

// ── isValidLocale ──────────────────────────────────────────────────────────

describe("isValidLocale", () => {
  it("returns true for 'en'", () => {
    expect(isValidLocale("en")).toBe(true);
  });

  it("returns true for 'fr'", () => {
    expect(isValidLocale("fr")).toBe(true);
  });

  it("returns false for 'de'", () => {
    expect(isValidLocale("de")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidLocale("")).toBe(false);
  });

  it("returns false for an arbitrary unsupported value", () => {
    expect(isValidLocale("zh")).toBe(false);
  });
});

// ── DEFAULT_LOCALE ─────────────────────────────────────────────────────────

describe("DEFAULT_LOCALE", () => {
  it("is 'en'", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("is a valid locale", () => {
    expect(isValidLocale(DEFAULT_LOCALE)).toBe(true);
  });
});

// ── loadTranslations ───────────────────────────────────────────────────────

describe("loadTranslations", () => {
  it("returns an object with the expected top-level keys for 'en'", async () => {
    const catalog = await loadTranslations("en");
    expect(catalog).toHaveProperty("common");
    expect(catalog).toHaveProperty("landing");
    expect(catalog).toHaveProperty("auth");
  });

  it("returns a catalog where common.siteName is 'MiniSlack'", async () => {
    const catalog = await loadTranslations("en");
    expect(catalog.common.siteName).toBe("MiniSlack");
  });
});

// ── getTranslator ──────────────────────────────────────────────────────────

describe("getTranslator", () => {
  it("returns a translator that resolves a known key (common.siteName)", async () => {
    const { t } = await getTranslator("en");
    expect(t("common.siteName")).toBe("MiniSlack");
  });

  it("returns the locale alongside the translator", async () => {
    const { locale } = await getTranslator("en");
    expect(locale).toBe("en");
    expect(locale in translationsLoaders).toBe(true);
  });

  it("translator resolves a nested key (landing.hero.headline)", async () => {
    const { t } = await getTranslator("en");
    expect(t("landing.hero.headline")).toBe("Team messaging without the noise");
  });

  it("translator interpolates params in landing.footer.copyright", async () => {
    const { t } = await getTranslator("en");
    expect(t("landing.footer.copyright", { year: "2025" })).toBe(
      "© 2025 MiniSlack",
    );
  });

  it("returns a translator for 'fr' locale", async () => {
    const { t, locale } = await getTranslator("fr");
    expect(locale).toBe("fr");
    expect(typeof t("common.siteName")).toBe("string");
  });
});
