/**
 * Property-based tests for proxy.ts redirect logic.
 *
 * Each property uses fast-check to generate random inputs and asserts that
 * the proxy behaves correctly across all valid input combinations.
 *
 * numRuns is set to 25 per property for a fast feedback loop.
 */

import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy.ts";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TEST_SECRET = "test-secret-that-is-at-least-32-chars-long!!";
const BASE_URL = "http://localhost:3000";

/** Signs a JWT with the given payload. expiresInSeconds < 0 → already expired. */
async function signToken(
  payload: Record<string, unknown>,
  expiresInSeconds: number,
): Promise<string> {
  const key = new TextEncoder().encode(TEST_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key);
}

/** Builds a NextRequest for the given path with optional headers/cookies. */
function makeRequest(
  pathname: string,
  options: {
    authHeader?: string;
    jwtCookie?: string;
    sessionCookie?: string;
    activeWorkspaceCookie?: string;
    search?: string;
    hash?: string;
  } = {},
): NextRequest {
  const url = new URL(
    pathname + (options.search ?? "") + (options.hash ?? ""),
    BASE_URL,
  );
  const headers = new Headers();

  if (options.authHeader) {
    headers.set("authorization", options.authHeader);
  }

  const cookieParts: string[] = [];
  if (options.jwtCookie) {
    cookieParts.push(`jwt=${options.jwtCookie}`);
  }
  if (options.sessionCookie) {
    cookieParts.push(`better-auth.session_token=${options.sessionCookie}`);
  }
  if (options.activeWorkspaceCookie) {
    cookieParts.push(`active_workspace_id=${options.activeWorkspaceCookie}`);
  }
  if (cookieParts.length > 0) {
    headers.set("cookie", cookieParts.join("; "));
  }

  return new NextRequest(url, { headers });
}

/** Returns true if the response is a redirect (3xx). */
function isRedirect(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

/** Returns the redirect destination pathname, or null if not a redirect. */
function redirectTarget(response: Response): string | null {
  if (!isRedirect(response)) return null;
  const location = response.headers.get("location");
  if (!location) return null;
  try {
    return new URL(location).pathname;
  } catch {
    return location;
  }
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a random Snowflake-style ID (19-digit numeric string). */
const snowflakeArb = fc
  .bigInt({ min: 1000000000000000000n, max: 9999999999999999999n })
  .map((n) => n.toString());

/** Generates a random user ID string. */
const userIdArb = fc
  .string({ minLength: 1, maxLength: 36 })
  .filter((s) => s.trim().length > 0);

/** Generates a random protected path (app group). */
const protectedPathArb = fc.oneof(
  fc.constant("/workspaces"),
  snowflakeArb.map((id) => `/workspaces/${id}`),
  snowflakeArb.map((id) => `/workspaces/${id}/channels/${id}`),
);

/** Generates a random auth route path. */
const authRouteArb = fc.oneof(fc.constant("/signin"), fc.constant("/"));

/** Generates a random excluded path (should pass through unmodified). */
const excludedPathArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `/_next/static/${s}`),
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `/_next/image/${s}`),
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `/api/${s}`),
  fc.constant("/favicon.ico"),
);

/** Generates a non-2xx HTTP status code. */
const failStatusArb = fc.oneof(
  fc.constant(400),
  fc.constant(401),
  fc.constant(403),
  fc.constant(500),
);

/** Generates a safe internal redirect path (starts with /, no protocol). */
const safeRedirectPathArb = fc.oneof(
  fc.constant("/workspaces"),
  snowflakeArb.map((id) => `/workspaces/${id}`),
  snowflakeArb.map((id) => `/workspaces/${id}/channels/${id}`),
  snowflakeArb.map((id) => `/workspaces/${id}?tab=members`),
);

/** Generates an unsafe redirect value (external URL or protocol-relative). */
const unsafeRedirectArb = fc.oneof(
  fc.constant("//evil.com"),
  fc.constant("http://evil.com"),
  fc.constant("https://evil.com/path"),
  fc.constant("javascript:alert(1)"),
  fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => !s.startsWith("/")),
);

/** Generates an optional query string (may be empty). */
const searchArb = fc.oneof(
  fc.constant(""),
  fc.constant("?tab=members"),
  snowflakeArb.map((id) => `?workspace=${id}`),
);

/** Generates an optional hash fragment (may be empty). */
const hashArb = fc.oneof(
  fc.constant(""),
  fc.constant("#section"),
  fc.constant("#top"),
);

// ---------------------------------------------------------------------------
// Test setup — JWT_SECRET env var
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.JWT_SECRET;
});

// ---------------------------------------------------------------------------
// Property 1: Protected routes require authentication
// ---------------------------------------------------------------------------

describe("Property 1: Protected routes require authentication", () => {
  it(
    "redirects to /signin for any protected path with no JWT and no session cookie",
    async () => {
      await fc.assert(
        fc.asyncProperty(protectedPathArb, async (pathname) => {
          // No JWT, no session cookie — completely unauthenticated request.
          // Mock fetch so rotateToken always fails (no session cookie to exchange).
          vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(null, { status: 401 }),
          );

          const request = makeRequest(pathname);
          const response = await proxy(request);

          expect(isRedirect(response)).toBe(true);
          expect(redirectTarget(response)).toBe("/signin");
        }),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 2: Valid JWT allows protected route access
// ---------------------------------------------------------------------------

describe("Property 2: Valid JWT allows protected route access", () => {
  it(
    "does NOT redirect for any protected path when a valid JWT is present",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          protectedPathArb,
          userIdArb,
          async (pathname, userId) => {
            // Sign a fresh, non-expired token (15 min TTL).
            const token = await signToken({ sub: userId }, 60 * 15);
            const request = makeRequest(pathname, {
              authHeader: `Bearer ${token}`,
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(false);
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 3: Token rotation preserves access
// ---------------------------------------------------------------------------

describe("Property 3: Token rotation preserves access", () => {
  it(
    "passes through and sets new JWT cookie when rotation succeeds",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          protectedPathArb,
          userIdArb,
          async (pathname, userId) => {
            // Expired JWT — verifyJwt will return null.
            const expiredToken = await signToken({ sub: userId }, -1);
            // The new token that the refresh endpoint will return.
            const newToken = await signToken({ sub: userId }, 60 * 15);

            // Mock fetch to simulate a successful /api/auth/refresh response.
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
              new Response(JSON.stringify({ token: newToken }), {
                status: 200,
                headers: { "content-type": "application/json" },
              }),
            );

            const request = makeRequest(pathname, {
              jwtCookie: expiredToken,
              sessionCookie: "some-session-token",
            });

            const response = await proxy(request);

            // Should NOT redirect.
            expect(isRedirect(response)).toBe(false);

            // Should set the new JWT as a cookie.
            const setCookie = response.headers.get("set-cookie");
            expect(setCookie).not.toBeNull();
            expect(setCookie).toContain("jwt=");
            expect(setCookie).toContain(newToken);
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 4: Failed token rotation redirects to sign-in
// ---------------------------------------------------------------------------

describe("Property 4: Failed token rotation redirects to sign-in", () => {
  it(
    "redirects to /signin when rotation returns a non-2xx status",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          protectedPathArb,
          failStatusArb,
          async (pathname, failStatus) => {
            // Mock fetch to simulate a failed /api/auth/refresh response.
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
              new Response(null, { status: failStatus }),
            );

            // No JWT — forces the proxy to attempt rotation.
            const request = makeRequest(pathname, {
              sessionCookie: "some-session-token",
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);
            expect(redirectTarget(response)).toBe("/signin");
          },
        ),
        { numRuns: 25 },
      );
    },
  );

  it(
    "redirects to /signin when rotation throws a network error",
    async () => {
      await fc.assert(
        fc.asyncProperty(protectedPathArb, async (pathname) => {
          // Mock fetch to simulate a network error.
          vi.spyOn(globalThis, "fetch").mockRejectedValue(
            new TypeError("fetch failed"),
          );

          const request = makeRequest(pathname, {
            sessionCookie: "some-session-token",
          });

          const response = await proxy(request);

          expect(isRedirect(response)).toBe(true);
          expect(redirectTarget(response)).toBe("/signin");
        }),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 5: Authenticated users redirected away from auth routes
// ---------------------------------------------------------------------------

describe("Property 5: Authenticated users redirected away from auth routes", () => {
  it(
    "redirects to /workspaces/<id> when active_workspace_id cookie is present",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          authRouteArb,
          userIdArb,
          snowflakeArb,
          async (pathname, userId, workspaceId) => {
            const token = await signToken({ sub: userId }, 60 * 15);
            const request = makeRequest(pathname, {
              authHeader: `Bearer ${token}`,
              activeWorkspaceCookie: workspaceId,
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);
            expect(redirectTarget(response)).toBe(`/workspaces/${workspaceId}`);
          },
        ),
        { numRuns: 25 },
      );
    },
  );

  it(
    "redirects to /workspaces when active_workspace_id cookie is absent",
    async () => {
      await fc.assert(
        fc.asyncProperty(authRouteArb, userIdArb, async (pathname, userId) => {
          const token = await signToken({ sub: userId }, 60 * 15);
          // No active_workspace_id cookie.
          const request = makeRequest(pathname, {
            authHeader: `Bearer ${token}`,
          });

          const response = await proxy(request);

          expect(isRedirect(response)).toBe(true);
          expect(redirectTarget(response)).toBe("/workspaces");
        }),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 6: Excluded paths pass through unmodified
// ---------------------------------------------------------------------------

describe("Property 6: Excluded paths pass through unmodified", () => {
  it(
    "passes through without redirect or cookie mutation for excluded paths",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          excludedPathArb,
          fc.boolean(), // whether a JWT is present
          userIdArb,
          async (pathname, hasJwt, userId) => {
            let token: string | undefined;
            if (hasJwt) {
              token = await signToken({ sub: userId }, 60 * 15);
            }

            const request = makeRequest(pathname, {
              authHeader: token ? `Bearer ${token}` : undefined,
            });

            const response = await proxy(request);

            // Must NOT redirect.
            expect(isRedirect(response)).toBe(false);

            // Must NOT set any cookies.
            const setCookie = response.headers.get("set-cookie");
            expect(setCookie).toBeNull();
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Bug Condition Exploration
// ---------------------------------------------------------------------------

describe("Bug Condition Exploration", () => {
  it(
    "BC1: authenticated request to /signin?redirect=%2Fworkspaces%2F123 should redirect to /workspaces/123",
    async () => {
      const token = await signToken({ sub: "user-bc1" }, 60 * 15);
      const request = makeRequest("/signin?redirect=%2Fworkspaces%2F123", {
        authHeader: `Bearer ${token}`,
      });

      const response = await proxy(request);

      expect(isRedirect(response)).toBe(true);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/workspaces/123",
      );
    },
  );

  it(
    "BC2: unauthenticated request to /workspaces/123 with failed rotation should redirect to /signin?redirect=/workspaces/123",
    async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, { status: 401 }),
      );

      const request = makeRequest("/workspaces/123", {
        sessionCookie: "some-session-token",
      });

      const response = await proxy(request);

      expect(isRedirect(response)).toBe(true);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/signin",
      );
      expect(
        new URL(response.headers.get("location")!).searchParams.get("redirect"),
      ).toBe("/workspaces/123");
    },
  );
});

// ---------------------------------------------------------------------------
// Property 7: Auth route respects safe redirect param (BC1 fix check)
// ---------------------------------------------------------------------------

describe("Property 7: Auth route respects safe redirect param", () => {
  it(
    "redirects to the redirect param value for authenticated /signin requests with a safe redirect",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          safeRedirectPathArb,
          fc.option(snowflakeArb),
          async (userId, redirectPath, workspaceId) => {
            const token = await signToken({ sub: userId }, 60 * 15);
            const encodedRedirect = encodeURIComponent(redirectPath);
            const request = makeRequest(
              `/signin?redirect=${encodedRedirect}`,
              {
                authHeader: `Bearer ${token}`,
                activeWorkspaceCookie: workspaceId ?? undefined,
              },
            );

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);
            const location = new URL(response.headers.get("location")!);
            expect(location.pathname).toBe(
              new URL(redirectPath, BASE_URL).pathname,
            );
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 8: Protected route redirect includes return path (BC2 fix check)
// ---------------------------------------------------------------------------

describe("Property 8: Protected route redirect includes return path", () => {
  it(
    "redirects to /signin?redirect=<fullPath> for unauthenticated protected routes when rotation fails",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          protectedPathArb,
          searchArb,
          hashArb,
          async (pathname, search, hash) => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
              new Response(null, { status: 401 }),
            );

            const request = makeRequest(pathname, {
              sessionCookie: "some-session-token",
              search,
              hash,
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);

            const location = new URL(response.headers.get("location")!);
            expect(location.pathname).toBe("/signin");

            const fullPath = pathname + search + hash;
            expect(location.searchParams.get("redirect")).toBe(fullPath);
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 9: Root auth route ignores redirect param (preservation)
// ---------------------------------------------------------------------------

describe("Property 9: Root auth route ignores redirect param", () => {
  it(
    "redirects authenticated users on / to workspace regardless of any redirect param",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.option(snowflakeArb),
          safeRedirectPathArb,
          async (userId, workspaceId, redirectPath) => {
            const token = await signToken({ sub: userId }, 60 * 15);
            const encodedRedirect = encodeURIComponent(redirectPath);
            const request = makeRequest(`/?redirect=${encodedRedirect}`, {
              authHeader: `Bearer ${token}`,
              activeWorkspaceCookie: workspaceId ?? undefined,
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);

            const location = new URL(response.headers.get("location")!);
            const expectedDestination = workspaceId
              ? `/workspaces/${workspaceId}`
              : "/workspaces";
            expect(location.pathname).toBe(expectedDestination);
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 10: Open redirect prevention (preservation)
// ---------------------------------------------------------------------------

describe("Property 10: Open redirect prevention — unsafe redirect falls back to workspace", () => {
  it(
    "falls back to workspace redirect for authenticated /signin requests with unsafe redirect values",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          unsafeRedirectArb,
          fc.option(snowflakeArb),
          async (userId, unsafeRedirect, workspaceId) => {
            const token = await signToken({ sub: userId }, 60 * 15);
            const encodedRedirect = encodeURIComponent(unsafeRedirect);
            const request = makeRequest(
              `/signin?redirect=${encodedRedirect}`,
              {
                authHeader: `Bearer ${token}`,
                activeWorkspaceCookie: workspaceId ?? undefined,
              },
            );

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);

            const location = new URL(response.headers.get("location")!);
            const expectedDestination = workspaceId
              ? `/workspaces/${workspaceId}`
              : "/workspaces";
            expect(location.pathname).toBe(expectedDestination);
          },
        ),
        { numRuns: 25 },
      );
    },
  );
});
