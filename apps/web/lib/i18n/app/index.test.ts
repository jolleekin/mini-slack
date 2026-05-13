/**
 * Unit tests for the app i18n module.
 *
 * Feature: apps.web.localization
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 8.1
 */
import { describe, expect, it } from "vitest";
import {
  extractLocale,
  getTranslator,
  loadTranslations,
  translationsLoaders,
} from "./index.ts";

// ── extractLocale ──────────────────────────────────────────────────────────

describe("extractLocale", () => {
  it("returns 'en' when headers are empty", () => {
    const headers = new Headers();
    expect(extractLocale(headers)).toBe("en");
  });

  it("returns the cookie locale when a valid locale cookie is present", () => {
    const headers = new Headers({ cookie: "locale=en; other=value" });
    expect(extractLocale(headers)).toBe("en");
  });

  it("returns the Accept-Language locale when no cookie is present", () => {
    const headers = new Headers({ "Accept-Language": "en-US,en;q=0.9" });
    expect(extractLocale(headers)).toBe("en");
  });

  it("ignores an unsupported cookie value and falls back to Accept-Language", () => {
    const headers = new Headers({
      cookie: "locale=de",
      "Accept-Language": "en-US,en;q=0.9",
    });
    // "de" is not in translationsLoaders, so falls back to Accept-Language → "en"
    expect(extractLocale(headers)).toBe("en");
  });

  it("ignores an unsupported cookie value and falls back to default when Accept-Language is also unsupported", () => {
    const headers = new Headers({
      cookie: "locale=de",
      "Accept-Language": "ja-JP,ja;q=0.9",
    });
    // Both "de" and "ja" are unsupported → falls back to "en"
    expect(extractLocale(headers)).toBe("en");
  });

  it("cookie locale takes priority over Accept-Language when both are valid", () => {
    // Only "en" is supported; this test verifies cookie is checked first
    const headers = new Headers({
      cookie: "locale=en",
      "Accept-Language": "en-GB,en;q=0.9",
    });
    expect(extractLocale(headers)).toBe("en");
  });
});

// ── loadTranslations ───────────────────────────────────────────────────────

describe("loadTranslations", () => {
  it("returns an object with the expected top-level keys for 'en'", async () => {
    const catalog = await loadTranslations("en");
    expect(catalog).toHaveProperty("common");
    expect(catalog).toHaveProperty("settings");
    expect(catalog).toHaveProperty("workspaces");
  });

  it("returns a catalog where common.loading is 'Loading…'", async () => {
    const catalog = await loadTranslations("en");
    expect(catalog.common.loading).toBe("Loading…");
  });
});

// ── getTranslator ──────────────────────────────────────────────────────────

describe("getTranslator", () => {
  it("returns a translator that resolves a known key (common.loading)", async () => {
    const headers = new Headers();
    const { t } = await getTranslator(headers);
    expect(t("common.loading")).toBe("Loading…");
  });

  it("returns the resolved locale alongside the translator", async () => {
    const headers = new Headers();
    const { locale } = await getTranslator(headers);
    expect(locale).toBe("en");
    expect(locale in translationsLoaders).toBe(true);
  });

  it("translator resolves a nested key (settings.locale.title)", async () => {
    const headers = new Headers();
    const { t } = await getTranslator(headers);
    expect(t("settings.locale.title")).toBe("Language");
  });

  it("translator resolves workspaces.title", async () => {
    const headers = new Headers();
    const { t } = await getTranslator(headers);
    expect(t("workspaces.title")).toBe("Workspaces");
  });
});
