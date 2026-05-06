import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAuthRoute, isProtectedRoute, isSafeRedirectPath, verifyJwt } from "@/proxy.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_SECRET = "test-secret-that-is-at-least-32-chars-long!!";

/**
 * Signs a JWT with the given payload and expiry offset (in seconds from now).
 * A negative `expiresInSeconds` produces an already-expired token.
 */
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

// ---------------------------------------------------------------------------
// verifyJwt
// ---------------------------------------------------------------------------

describe("verifyJwt", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("returns the decoded payload for a valid token", async () => {
    const token = await signToken({ sub: "user-1" }, 60 * 15); // 15 min
    const result = await verifyJwt(token);

    expect(result).not.toBeNull();
    expect(result?.sub).toBe("user-1");
    expect(typeof result?.exp).toBe("number");
    expect(typeof result?.iat).toBe("number");
  });

  it("returns null for an expired token", async () => {
    const token = await signToken({ sub: "user-2" }, -1); // already expired
    const result = await verifyJwt(token);

    expect(result).toBeNull();
  });

  it("returns null for a malformed token", async () => {
    const result = await verifyJwt("this.is.not.a.jwt");

    expect(result).toBeNull();
  });

  it("returns null when the token was signed with the wrong secret", async () => {
    const wrongKey = new TextEncoder().encode("completely-different-secret-!!!");
    const token = await new SignJWT({ sub: "user-3" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 900)
      .sign(wrongKey);

    const result = await verifyJwt(token);

    expect(result).toBeNull();
  });

  it("returns null when JWT_SECRET is not set", async () => {
    delete process.env.JWT_SECRET;
    const token = await signToken({ sub: "user-4" }, 900);
    const result = await verifyJwt(token);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isProtectedRoute
// ---------------------------------------------------------------------------

describe("isProtectedRoute", () => {
  it("returns true for /workspaces (exact)", () => {
    expect(isProtectedRoute("/workspaces")).toBe(true);
  });

  it("returns true for /workspaces/123 (nested)", () => {
    expect(isProtectedRoute("/workspaces/123")).toBe(true);
  });

  it("returns true for /workspaces/123/channels/456 (nested channel route)", () => {
    expect(isProtectedRoute("/workspaces/123/channels/456")).toBe(true);
  });

  it("returns false for /signin", () => {
    expect(isProtectedRoute("/signin")).toBe(false);
  });

  it("returns false for / (root)", () => {
    expect(isProtectedRoute("/")).toBe(false);
  });

  it("returns false for /_next/static/foo", () => {
    expect(isProtectedRoute("/_next/static/foo")).toBe(false);
  });

  it("returns false for /api/auth/signin", () => {
    expect(isProtectedRoute("/api/auth/signin")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAuthRoute
// ---------------------------------------------------------------------------

describe("isAuthRoute", () => {
  it("returns true for /signin", () => {
    expect(isAuthRoute("/signin")).toBe(true);
  });

  it("returns true for / (root)", () => {
    expect(isAuthRoute("/")).toBe(true);
  });

  it("returns false for /welcome", () => {
    expect(isAuthRoute("/welcome")).toBe(false);
  });

  it("returns false for /workspaces", () => {
    expect(isAuthRoute("/workspaces")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSafeRedirectPath
// ---------------------------------------------------------------------------

describe("isSafeRedirectPath", () => {
  it("returns true for /workspaces (valid internal path)", () => {
    expect(isSafeRedirectPath("/workspaces")).toBe(true);
  });

  it("returns true for /workspaces/123 (valid internal path with segment)", () => {
    expect(isSafeRedirectPath("/workspaces/123")).toBe(true);
  });

  it("returns true for /workspaces/123/channels/456 (valid nested channel path)", () => {
    expect(isSafeRedirectPath("/workspaces/123/channels/456")).toBe(true);
  });

  it("returns true for /workspaces/123?tab=members (valid path with query string)", () => {
    expect(isSafeRedirectPath("/workspaces/123?tab=members")).toBe(true);
  });

  it("returns false for //evil.com (protocol-relative URL — open redirect)", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
  });

  it("returns false for http://evil.com (absolute URL with protocol)", () => {
    expect(isSafeRedirectPath("http://evil.com")).toBe(false);
  });

  it("returns false for https://evil.com/path (absolute URL with protocol)", () => {
    expect(isSafeRedirectPath("https://evil.com/path")).toBe(false);
  });

  it("returns false for javascript:alert(1) (contains :)", () => {
    expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
  });

  it('returns false for "" (empty string — does not start with /)', () => {
    expect(isSafeRedirectPath("")).toBe(false);
  });

  it("returns false for workspaces/123 (relative path, no leading /)", () => {
    expect(isSafeRedirectPath("workspaces/123")).toBe(false);
  });

  it("returns false for ../etc/passwd (relative path, no leading /)", () => {
    expect(isSafeRedirectPath("../etc/passwd")).toBe(false);
  });
});
