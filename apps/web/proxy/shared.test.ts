import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { detectLocale, isSafeRedirectPath, LOCALE_COOKIE_OPTIONS } from "./shared.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:3000";

function makeRequest(
  pathname: string,
  options: {
    localeCookie?: string;
    acceptLanguage?: string;
  } = {},
): NextRequest {
  const url = new URL(pathname, BASE_URL);
  const headers = new Headers();

  const cookieParts: string[] = [];
  if (options.localeCookie !== undefined) {
    cookieParts.push(`locale=${options.localeCookie}`);
  }
  if (cookieParts.length > 0) {
    headers.set("cookie", cookieParts.join("; "));
  }
  if (options.acceptLanguage !== undefined) {
    headers.set("Accept-Language", options.acceptLanguage);
  }

  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// detectLocale
// ---------------------------------------------------------------------------

describe("detectLocale", () => {
  it("returns the locale cookie value when it is a supported locale", () => {
    const request = makeRequest("/", { localeCookie: "fr" });
    expect(detectLocale(request)).toBe("fr");
  });

  it("returns the locale cookie value when it is 'en'", () => {
    const request = makeRequest("/", { localeCookie: "en" });
    expect(detectLocale(request)).toBe("en");
  });

  it("ignores an unsupported locale cookie and falls back to Accept-Language", () => {
    const request = makeRequest("/", {
      localeCookie: "de",
      acceptLanguage: "fr",
    });
    expect(detectLocale(request)).toBe("fr");
  });

  it("falls back to Accept-Language when no locale cookie is set", () => {
    const request = makeRequest("/", { acceptLanguage: "fr" });
    expect(detectLocale(request)).toBe("fr");
  });

  it("extracts the primary language tag from a full Accept-Language header", () => {
    const request = makeRequest("/", { acceptLanguage: "fr-FR,fr;q=0.9,en;q=0.8" });
    expect(detectLocale(request)).toBe("fr");
  });

  it("falls back to DEFAULT_LOCALE when Accept-Language is unsupported", () => {
    const request = makeRequest("/", { acceptLanguage: "de" });
    expect(detectLocale(request)).toBe("en");
  });

  it("falls back to DEFAULT_LOCALE when no cookie and no Accept-Language header", () => {
    const request = makeRequest("/");
    expect(detectLocale(request)).toBe("en");
  });

  it("cookie locale takes priority over Accept-Language", () => {
    const request = makeRequest("/", {
      localeCookie: "fr",
      acceptLanguage: "en",
    });
    expect(detectLocale(request)).toBe("fr");
  });
});

// ---------------------------------------------------------------------------
// isSafeRedirectPath
// ---------------------------------------------------------------------------

describe("isSafeRedirectPath", () => {
  it("returns true for a simple internal path", () => {
    expect(isSafeRedirectPath("/app/workspaces")).toBe(true);
  });

  it("returns true for a path with query string", () => {
    expect(isSafeRedirectPath("/app/workspaces?tab=members")).toBe(true);
  });

  it("returns true for a deeply nested path", () => {
    expect(isSafeRedirectPath("/app/workspaces/123/channels/456")).toBe(true);
  });

  it("returns false for a protocol-relative URL (//evil.com)", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
  });

  it("returns false for an absolute URL with http:", () => {
    expect(isSafeRedirectPath("http://evil.com")).toBe(false);
  });

  it("returns false for an absolute URL with https:", () => {
    expect(isSafeRedirectPath("https://evil.com/path")).toBe(false);
  });

  it("returns false for javascript: URI", () => {
    expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isSafeRedirectPath("")).toBe(false);
  });

  it("returns false for a relative path without leading slash", () => {
    expect(isSafeRedirectPath("app/workspaces")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LOCALE_COOKIE_OPTIONS
// ---------------------------------------------------------------------------

describe("LOCALE_COOKIE_OPTIONS", () => {
  it("has path set to /", () => {
    expect(LOCALE_COOKIE_OPTIONS.path).toBe("/");
  });

  it("has a maxAge of one year in seconds", () => {
    expect(LOCALE_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 365);
  });

  it("has sameSite set to lax", () => {
    expect(LOCALE_COOKIE_OPTIONS.sameSite).toBe("lax");
  });

  it("has httpOnly set to false (readable by client JS)", () => {
    expect(LOCALE_COOKIE_OPTIONS.httpOnly).toBe(false);
  });
});
