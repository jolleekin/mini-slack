import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { landingProxy } from "./landing.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:3000";

function makeRequest(
  pathname: string,
  options: {
    localeCookie?: string;
    acceptLanguage?: string;
    search?: string;
  } = {},
): NextRequest {
  const url = new URL(pathname + (options.search ?? ""), BASE_URL);
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

function getSetCookieLocale(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/locale=([^;]+)/);
  return match ? match[1] : null;
}

function redirectPathname(response: Response): string | null {
  const location = response.headers.get("location");
  if (!location) return null;
  try {
    return new URL(location).pathname;
  } catch {
    return location;
  }
}

// ---------------------------------------------------------------------------
// Bare "/" redirect
// ---------------------------------------------------------------------------

describe("landingProxy — bare /", () => {
  it("redirects / to /en when no locale signals are present", () => {
    const request = makeRequest("/");
    const response = landingProxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(redirectPathname(response)).toBe("/en");
  });

  it("redirects / to /fr when locale cookie is fr", () => {
    const request = makeRequest("/", { localeCookie: "fr" });
    const response = landingProxy(request);

    expect(redirectPathname(response)).toBe("/fr");
  });

  it("redirects / to /fr when Accept-Language is fr", () => {
    const request = makeRequest("/", { acceptLanguage: "fr" });
    const response = landingProxy(request);

    expect(redirectPathname(response)).toBe("/fr");
  });

  it("preserves query parameters when redirecting /", () => {
    const request = makeRequest("/", { search: "?ref=homepage" });
    const response = landingProxy(request);

    const location = response.headers.get("location")!;
    const url = new URL(location);
    expect(url.search).toBe("?ref=homepage");
  });

  it("sets locale cookie on / redirect", () => {
    const request = makeRequest("/", { localeCookie: "fr" });
    const response = landingProxy(request);

    expect(getSetCookieLocale(response)).toBe("fr");
  });
});

// ---------------------------------------------------------------------------
// Unsupported first segment redirect
// ---------------------------------------------------------------------------

describe("landingProxy — unsupported first segment", () => {
  it("redirects /de to /en/de when de is not a supported locale", () => {
    const request = makeRequest("/de");
    const response = landingProxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(redirectPathname(response)).toBe("/en/de");
  });

  it("redirects /de/some/path to /en/de/some/path", () => {
    const request = makeRequest("/de/some/path");
    const response = landingProxy(request);

    expect(redirectPathname(response)).toBe("/en/de/some/path");
  });

  it("sets locale cookie to DEFAULT_LOCALE on unsupported segment redirect", () => {
    const request = makeRequest("/de/page");
    const response = landingProxy(request);

    expect(getSetCookieLocale(response)).toBe("en");
  });

  it("redirects /signin to /en/signin (bare path with no locale prefix)", () => {
    const request = makeRequest("/signin");
    const response = landingProxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(redirectPathname(response)).toBe("/en/signin");
  });
});

// ---------------------------------------------------------------------------
// Valid locale pass-through
// ---------------------------------------------------------------------------

describe("landingProxy — valid locale pass-through", () => {
  it("passes through /en without redirecting", () => {
    const request = makeRequest("/en");
    const response = landingProxy(request);

    expect(response.status).toBe(200);
  });

  it("passes through /fr without redirecting", () => {
    const request = makeRequest("/fr");
    const response = landingProxy(request);

    expect(response.status).toBe(200);
  });

  it("passes through /en/signin without redirecting", () => {
    const request = makeRequest("/en/signin");
    const response = landingProxy(request);

    expect(response.status).toBe(200);
  });

  it("sets locale cookie to the path segment value on pass-through", () => {
    const request = makeRequest("/fr/some/page");
    const response = landingProxy(request);

    expect(getSetCookieLocale(response)).toBe("fr");
  });

  it("sets locale cookie to en for /en/* paths", () => {
    const request = makeRequest("/en/signin");
    const response = landingProxy(request);

    expect(getSetCookieLocale(response)).toBe("en");
  });
});
