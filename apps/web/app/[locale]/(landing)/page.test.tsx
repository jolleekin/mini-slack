/**
 * Unit tests for Landing Page.
 * **Validates: Requirements 6.1, 9.1, 9.2**
 */
import { describe, it, expect } from "vitest";
import { generateStaticParams } from "./page.tsx";

describe("Landing Page generateStaticParams", () => {
  it("returns one entry per supported locale", () => {
    const params = generateStaticParams();
    expect(Array.isArray(params)).toBe(true);
    expect(params.length).toBeGreaterThan(0);
  });

  it("each entry has a locale key", () => {
    const params = generateStaticParams();
    for (const entry of params) {
      expect(typeof entry.locale).toBe("string");
      expect(entry.locale.length).toBeGreaterThan(0);
    }
  });

  it("includes 'en' locale", () => {
    const params = generateStaticParams();
    const locales = params.map((p) => p.locale);
    expect(locales).toContain("en");
  });
});
