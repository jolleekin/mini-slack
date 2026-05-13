import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock auth before importing appProxy so the module picks up the mock
vi.mock("@/lib/identity/auth.ts", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/identity/auth.ts";
import { appProxy } from "./app.ts";

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

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unauthenticated requests
// ---------------------------------------------------------------------------

describe("appProxy — unauthenticated", () => {
  it("redirects to /en/signin when no session and no locale signals", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces");
    const response = await appProxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(redirectPathname(response)).toBe("/en/signin");
  });

  it("redirects to /fr/signin when locale cookie is fr", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces", { localeCookie: "fr" });
    const response = await appProxy(request);

    expect(redirectPathname(response)).toBe("/fr/signin");
  });

  it("includes redirect param pointing to the original path", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces");
    const response = await appProxy(request);

    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("redirect")).toBe("/app/workspaces");
  });

  it("includes redirect param with query string", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces", { search: "?tab=members" });
    const response = await appProxy(request);

    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("redirect")).toBe("/app/workspaces?tab=members");
  });

  it("sets locale cookie when no locale cookie is present", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces");
    const response = await appProxy(request);

    expect(getSetCookieLocale(response)).toBe("en");
  });

  it("does NOT set locale cookie when locale cookie is already present", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest("/app/workspaces", { localeCookie: "fr" });
    const response = await appProxy(request);

    // Cookie is already present — should not be set again
    expect(getSetCookieLocale(response)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Authenticated requests
// ---------------------------------------------------------------------------

describe("appProxy — authenticated", () => {
  const fakeSession = { user: { id: "user-1" }, session: { id: "sess-1" } };

  it("passes through without redirecting when session is valid", async () => {
    mockGetSession.mockResolvedValue(fakeSession);

    const request = makeRequest("/app/workspaces");
    const response = await appProxy(request);

    expect(response.status).toBe(200);
  });

  it("sets locale cookie when no locale cookie is present", async () => {
    mockGetSession.mockResolvedValue(fakeSession);

    const request = makeRequest("/app/workspaces");
    const response = await appProxy(request);

    expect(getSetCookieLocale(response)).toBe("en");
  });

  it("does NOT set locale cookie when locale cookie is already present", async () => {
    mockGetSession.mockResolvedValue(fakeSession);

    const request = makeRequest("/app/workspaces", { localeCookie: "fr" });
    const response = await appProxy(request);

    expect(getSetCookieLocale(response)).toBeNull();
  });

  it("uses Accept-Language to set locale cookie when no cookie is present", async () => {
    mockGetSession.mockResolvedValue(fakeSession);

    const request = makeRequest("/app/workspaces", { acceptLanguage: "fr" });
    const response = await appProxy(request);

    expect(getSetCookieLocale(response)).toBe("fr");
  });
});
