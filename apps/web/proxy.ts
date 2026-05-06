import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

/**
 * Minimum claims expected in every JWT issued by this application.
 */
export interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

/**
 * Verifies a JWT string using the JWT_SECRET environment variable.
 * Returns the decoded payload or null on any error (expired, malformed, wrong secret).
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[proxy] JWT_SECRET is not set — all JWT verifications will fail.");
    }
    return null;
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true for paths that belong to the (app) route group and therefore
 * require an authenticated session.
 *
 * Covered paths: /workspaces and /workspaces/[...] (including nested channel
 * routes such as /workspaces/[id]/channels/[id]).
 */
export function isProtectedRoute(pathname: string): boolean {
  return (
    pathname === "/workspaces" ||
    pathname.startsWith("/workspaces/")
  );
}

/**
 * Returns true for paths where an already-authenticated user should be
 * redirected away (i.e. the sign-in page and the landing root).
 */
export function isAuthRoute(pathname: string): boolean {
  return pathname === "/signin" || pathname === "/";
}

/**
 * Returns true if `path` is a safe internal redirect target.
 *
 * A safe path:
 *  - starts with "/" (absolute path, not relative)
 *  - does NOT start with "//" (protocol-relative URL — open redirect)
 *  - does NOT contain ":" (rules out http:, https:, javascript:, etc.)
 */
export function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes(":");
}

/**
 * Attempts to exchange the existing Better Auth session cookie for a new JWT
 * by calling POST /api/auth/refresh.
 * Returns the new JWT string on success, or null on any failure.
 */
export async function rotateToken(request: NextRequest): Promise<string | null> {
  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const response = await fetch(refreshUrl.toString(), {
      method: "POST",
      headers: {
        // Forward the session cookie so the refresh endpoint can identify the user.
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Main proxy function — runs on the Edge Runtime before every matched request.
 *
 * Logic:
 *  1. Excluded paths (static assets, /api/auth) → pass through (handled by matcher).
 *  2. Extract JWT from Authorization header or `jwt` cookie.
 *  3. Verify JWT; on failure attempt token rotation.
 *  4. Auth routes (/ or /signin) + valid JWT → redirect to workspace.
 *  5. Protected routes + no valid JWT after rotation → redirect to /signin.
 *  6. Protected routes + rotation succeeded → pass through with new JWT cookie.
 *  7. Everything else → pass through.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // --- 1. Extract JWT ---
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const cookieToken = request.cookies.get("jwt")?.value ?? null;
  const rawToken = bearerToken ?? cookieToken;

  // --- 2. Verify JWT ---
  let payload = rawToken ? await verifyJwt(rawToken) : null;
  let rotatedToken: string | null = null;

  if (!payload) {
    // --- 3. Attempt token rotation ---
    rotatedToken = await rotateToken(request);
    if (rotatedToken) {
      payload = await verifyJwt(rotatedToken);
    }
  }

  const isAuthenticated = payload !== null;

  // --- 4. Auth routes: redirect authenticated users away ---
  if (isAuthRoute(pathname) && isAuthenticated) {
    const activeWorkspaceId =
      request.cookies.get("active_workspace_id")?.value ?? null;
    const workspaceDestination = activeWorkspaceId
      ? `/workspaces/${activeWorkspaceId}`
      : "/workspaces";

    if (pathname === "/signin") {
      // Only /signin honours the redirect param — / is not a sign-in entry point.
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const destination =
        redirectParam && isSafeRedirectPath(redirectParam)
          ? redirectParam
          : workspaceDestination;
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // pathname === "/" — always redirect to workspace, ignore any query params.
    return NextResponse.redirect(new URL(workspaceDestination, request.url));
  }

  // --- 5. Protected routes: redirect unauthenticated users to sign-in ---
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const { pathname: pn, search, hash } = request.nextUrl;
    const fullPath = pn + search + hash;
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(signinUrl);
  }

  // --- 6. Protected routes: rotation succeeded — pass through with new cookie ---
  if (isProtectedRoute(pathname) && rotatedToken) {
    const response = NextResponse.next();
    response.cookies.set("jwt", rotatedToken, {
      httpOnly: false, // must be readable by client JS for in-memory storage
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  }

  // --- 7. Default: pass through ---
  return NextResponse.next();
}
