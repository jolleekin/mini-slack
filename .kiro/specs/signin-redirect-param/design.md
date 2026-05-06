# signin-redirect-param Bugfix Design

## Overview

The proxy middleware (`apps/web/proxy.ts`) has two related redirect bugs that break deep-linked navigation:

1. **Bug Condition 1** — When an authenticated user visits `/signin?redirect=/some/path`, the proxy ignores the `redirect` param and sends them to their workspace instead of the intended destination.
2. **Bug Condition 2** — When an unauthenticated user hits a protected route and token rotation fails, the proxy redirects them to `/signin` without appending a `?redirect=` param, making it impossible to return them to their original destination after sign-in.

The fix adds a new exported helper `isSafeRedirectPath` for open-redirect validation, patches step 4 of `proxy()` to honour the `redirect` param on `/signin` only, and patches step 5 to append the full return path as a `?redirect=` param on the `/signin` redirect. The signin page (`apps/web/app/(auth)/signin/page.tsx`) is also updated to consume the param after successful authentication.

No new dependencies are introduced. All changes are confined to `apps/web/proxy.ts`, `apps/web/tests/proxy/`, and `apps/web/app/(auth)/signin/page.tsx`.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — either an authenticated user visiting `/signin` with a safe `redirect` param (C1), or an unauthenticated user hitting a protected route where rotation fails (C2).
- **Property (P)**: The desired correct behavior for each bug condition — C1 should redirect to the `redirect` param value; C2 should redirect to `/signin?redirect=<encoded-full-path>`.
- **Preservation**: Existing proxy behaviors that must remain unchanged by the fix — workspace fallback redirects, token rotation pass-through, excluded path pass-through, and root `/` auth route behavior.
- **`isSafeRedirectPath(path)`**: New exported helper in `proxy.ts` that validates a redirect target is a safe internal path.
- **`proxy(request)`**: The main middleware function in `proxy.ts` that runs on the Edge Runtime before every matched request.
- **`isAuthRoute(pathname)`**: Existing helper that returns `true` for `/signin` and `/`.
- **`isProtectedRoute(pathname)`**: Existing helper that returns `true` for `/workspaces`, `/workspaces/*`, and `/channels/*`.
- **`rotateToken(request)`**: Existing helper that attempts to exchange a Better Auth session cookie for a new JWT.
- **full path**: The combination of `pathname + search + hash` from `request.nextUrl` — e.g. `/workspaces/123?tab=members#section`.

---

## Bug Details

### Bug Condition 1 — Ignored redirect param on auth route

The bug manifests when an authenticated user visits `/signin` with a `?redirect=<path>` query parameter. Step 4 of `proxy()` currently redirects all authenticated users on auth routes to their workspace without inspecting the `redirect` param. The `/` root auth route is intentionally excluded from this treatment — only `/signin` should honour the param.

**Formal Specification:**
```
FUNCTION isBugCondition1(X)
  INPUT: X of type ProxyRequest
  OUTPUT: boolean

  RETURN X.pathname = "/signin"
    AND isAuthenticated(X)
    AND X.searchParams.has("redirect")
    AND isSafeRedirectPath(X.searchParams.get("redirect"))
END FUNCTION
```

### Bug Condition 2 — Missing redirect param on protected route redirect

The bug manifests when an unauthenticated user visits a protected route and token rotation fails. Step 5 of `proxy()` currently redirects to `/signin` with no query params, discarding the original destination.

**Formal Specification:**
```
FUNCTION isBugCondition2(X)
  INPUT: X of type ProxyRequest
  OUTPUT: boolean

  RETURN isProtectedRoute(X.pathname)
    AND NOT isAuthenticated(X)
    AND rotationFails(X)
END FUNCTION
```

### Examples

**Bug Condition 1:**
- Authenticated user visits `/signin?redirect=%2Fworkspaces%2F123` → currently redirected to `/workspaces/123` (workspace cookie) or `/workspaces`; **should** redirect to `/workspaces/123`
- Authenticated user visits `/signin?redirect=https%3A%2F%2Fevil.com` → should fall back to workspace redirect (open redirect prevention)
- Authenticated user visits `/signin` (no redirect param) → should continue redirecting to workspace as before
- Authenticated user visits `/?redirect=%2Fworkspaces%2F123` → should continue redirecting to workspace (root route is not a sign-in entry point)

**Bug Condition 2:**
- Unauthenticated user visits `/workspaces/123` → currently redirected to `/signin`; **should** redirect to `/signin?redirect=%2Fworkspaces%2F123`
- Unauthenticated user visits `/workspaces/123?tab=members#section` → should redirect to `/signin?redirect=%2Fworkspaces%2F123%3Ftab%3Dmembers%23section`
- Unauthenticated user visits `/channels/456` → should redirect to `/signin?redirect=%2Fchannels%2F456`

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated users visiting `/signin` with no `?redirect=` param must continue to be redirected to `/workspaces/<active_workspace_id>` when the `active_workspace_id` cookie is present (requirement 3.1)
- Authenticated users visiting `/signin` with no `?redirect=` param must continue to be redirected to `/workspaces` when the `active_workspace_id` cookie is absent (requirement 3.2)
- Authenticated users visiting `/` (root) with any query params must continue to be redirected to their workspace — the root route is not a sign-in entry point (requirement 2.4)
- Unauthenticated users on protected routes where token rotation succeeds must continue to pass through with the new JWT cookie set — no redirect (requirement 3.3)
- Excluded paths (`/_next/static`, `/_next/image`, `/api/auth/*`, `/favicon.ico`) must continue to pass through without redirect or cookie mutation (requirement 3.5)
- Users with a valid JWT on protected routes must continue to pass through without redirecting (requirement 3.6)

**Scope:**
All inputs that do NOT satisfy isBugCondition1 or isBugCondition2 must be completely unaffected by this fix. This includes:
- All requests to `/` (root auth route)
- Authenticated requests to `/signin` with no `redirect` param
- Authenticated requests to `/signin` with an unsafe `redirect` param (falls back to workspace redirect)
- Unauthenticated requests to protected routes where rotation succeeds

---

## Hypothesized Root Cause

Based on the bug description and reading `proxy.ts`:

1. **Step 4 does not inspect `request.nextUrl.searchParams`**: The current implementation unconditionally builds the workspace destination and returns the redirect without checking for a `redirect` param. The fix requires reading `searchParams.get("redirect")`, validating it with `isSafeRedirectPath`, and using it as the destination when valid — but only for `/signin`, not `/`.

2. **Step 5 builds the redirect URL without a return path**: `new URL("/signin", request.url)` produces a bare `/signin` URL. The fix requires constructing the full return path from `request.nextUrl.pathname + request.nextUrl.search + request.nextUrl.hash` and appending it as a URL-encoded `redirect` param.

3. **No open-redirect validation helper exists**: The validation logic (starts with `/`, does not start with `//`, does not contain `:`) needs to be extracted into a named, exported `isSafeRedirectPath` function so it can be unit-tested independently and reused by the signin page.

4. **Signin page does not consume the `redirect` param**: The page is currently a stub. After successful authentication, it needs to read the `redirect` searchParam from page props, validate it with `isSafeRedirectPath`, and navigate to it (or fall back to `/workspaces`).

---

## Correctness Properties

Property 1: Bug Condition 1 Fix — Auth route respects safe redirect param

_For any_ authenticated request to `/signin` where a `redirect` query param is present and `isSafeRedirectPath(redirect)` returns `true`, the fixed `proxy()` function SHALL redirect the user to the path specified in the `redirect` param rather than to their workspace.

**Validates: Requirements 2.1**

Property 2: Bug Condition 2 Fix — Protected route redirect includes return path

_For any_ unauthenticated request to a protected route where token rotation fails, the fixed `proxy()` function SHALL redirect to `/signin` with a `?redirect=<encoded-full-path>` query param where `<encoded-full-path>` is the URL-encoded combination of the original `pathname + search + hash`.

**Validates: Requirements 2.5**

Property 3: Preservation — Root auth route ignores redirect param

_For any_ authenticated request to `/` (root) with any query params (including a `redirect` param), the fixed `proxy()` function SHALL produce the same result as the original function — redirecting to the workspace destination and ignoring any `redirect` param.

**Validates: Requirements 2.4, 3.1, 3.2**

Property 4: Preservation — Open redirect prevention falls back to workspace

_For any_ authenticated request to `/signin` where the `redirect` param is present but `isSafeRedirectPath(redirect)` returns `false` (external URLs, protocol-relative paths, relative paths), the fixed `proxy()` function SHALL fall back to the workspace redirect, identical to the behavior when no `redirect` param is present.

**Validates: Requirements 2.2, 2.3**

---

## Fix Implementation

### New Helper — `isSafeRedirectPath`

**File**: `apps/web/proxy.ts`

**Signature**: `export function isSafeRedirectPath(path: string): boolean`

**Logic**:
```
FUNCTION isSafeRedirectPath(path)
  INPUT: path of type string
  OUTPUT: boolean

  RETURN path.startsWith("/")
    AND NOT path.startsWith("//")
    AND NOT path.includes(":")
END FUNCTION
```

This must be exported so it can be imported in `helpers.test.ts` and in the signin page.

### Change 1 — Step 4: Auth route respects `redirect` param

**File**: `apps/web/proxy.ts`

**Function**: `proxy()`

**Location**: Step 4 — the `isAuthRoute(pathname) && isAuthenticated` branch

**Specific Changes**:

1. **Split the auth route check by pathname**: Only `/signin` gets the redirect-param treatment. The `/` root route continues to redirect unconditionally to the workspace destination.

2. **Extract and validate the redirect param** (for `/signin` only):
   ```
   const redirectParam = request.nextUrl.searchParams.get("redirect")
   const destination = (redirectParam && isSafeRedirectPath(redirectParam))
     ? redirectParam
     : (activeWorkspaceId ? `/workspaces/${activeWorkspaceId}` : "/workspaces")
   ```

3. **Return the redirect** using the resolved destination.

The `/` branch remains unchanged — it always redirects to the workspace destination.

### Change 2 — Step 5: Protected route redirect appends `redirect` param

**File**: `apps/web/proxy.ts`

**Function**: `proxy()`

**Location**: Step 5 — the `isProtectedRoute(pathname) && !isAuthenticated` branch

**Specific Changes**:

1. **Build the full return path** from `request.nextUrl`:
   ```
   const { pathname, search, hash } = request.nextUrl
   const fullPath = pathname + search + hash
   ```

2. **Construct the sign-in URL with the encoded return path**:
   ```
   const signinUrl = new URL("/signin", request.url)
   signinUrl.searchParams.set("redirect", fullPath)
   return NextResponse.redirect(signinUrl)
   ```

   Using `searchParams.set()` ensures `fullPath` is correctly percent-encoded.

### Change 3 — Signin page consumes `redirect` param

**File**: `apps/web/app/(auth)/signin/page.tsx`

**Scope**: This is a separate concern from the proxy fix, but required for the full round-trip to work. The proxy's responsibility ends at appending the param; the signin page is responsible for reading it after authentication.

**Specific Changes**:

1. **Accept `searchParams` from page props** (Next.js App Router passes these as a prop to page components).

2. **After successful authentication**, read `searchParams.redirect`, validate it with `isSafeRedirectPath` (imported from `@/proxy.ts`), and navigate to it using the router. Fall back to `/workspaces` if absent or unsafe.

3. The page should not redirect before authentication — the param is only consumed post-sign-in.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed code, then verify the fix works correctly and preserves all existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fix. Confirm the root cause analysis. If refuted, re-hypothesize.

**Test Plan**: Write tests that construct requests matching each bug condition and assert the expected (fixed) behavior. Run these on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **BC1 — Safe redirect param ignored**: Authenticated request to `/signin?redirect=%2Fworkspaces%2F123` — assert redirect target is `/workspaces/123` (will fail on unfixed code, which redirects to workspace)
2. **BC1 — Root route still ignores redirect**: Authenticated request to `/?redirect=%2Fworkspaces%2F123` — assert redirect target is workspace (should pass on unfixed code, verifying the root route is unaffected)
3. **BC2 — Missing redirect param on protected route**: Unauthenticated request to `/workspaces/123` with rotation failing — assert redirect target is `/signin?redirect=%2Fworkspaces%2F123` (will fail on unfixed code, which redirects to bare `/signin`)
4. **BC2 — Full path with search and hash**: Unauthenticated request to `/workspaces/123?tab=members#section` — assert the full encoded path appears in the redirect (will fail on unfixed code)

**Expected Counterexamples**:
- BC1: `redirectTarget(response)` returns `/workspaces/<id>` or `/workspaces` instead of the `redirect` param value
- BC2: `redirectTarget(response)` returns `/signin` with no `redirect` query param

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed function produces the expected behavior.

**Pseudocode — Bug Condition 1:**
```
FOR ALL X WHERE isBugCondition1(X) DO
  result := proxy'(X)
  ASSERT isRedirect(result)
    AND redirectTarget(result) = X.searchParams.get("redirect")
END FOR
```

**Pseudocode — Bug Condition 2:**
```
FOR ALL X WHERE isBugCondition2(X) DO
  result := proxy'(X)
  fullPath := X.pathname + X.search + X.hash
  ASSERT isRedirect(result)
    AND new URL(redirectTarget(result)).pathname = "/signin"
    AND new URL(redirectTarget(result)).searchParams.get("redirect") = fullPath
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where neither bug condition holds, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition1(X) AND NOT isBugCondition2(X) DO
  ASSERT proxy(X) = proxy'(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Cases**:
1. **Root route preservation**: Authenticated requests to `/` with any query params (including `redirect`) still redirect to workspace — verifies the root route is not affected by the BC1 fix
2. **Open redirect prevention**: Authenticated requests to `/signin` with unsafe `redirect` values fall back to workspace redirect — verifies the validation logic
3. **No-param preservation**: Authenticated requests to `/signin` with no `redirect` param continue to redirect to workspace — verifies the fallback path is unchanged

### Unit Tests — `isSafeRedirectPath` (add to `helpers.test.ts`)

These tests cover the new exported helper independently:

| Input | Expected | Reason |
|-------|----------|--------|
| `/workspaces` | `true` | Valid internal path |
| `/workspaces/123` | `true` | Valid internal path with segment |
| `/channels/456` | `true` | Valid internal path |
| `/workspaces/123?tab=members` | `true` | Valid path with query string |
| `//evil.com` | `false` | Protocol-relative URL (open redirect) |
| `http://evil.com` | `false` | Absolute URL with protocol |
| `https://evil.com/path` | `false` | Absolute URL with protocol |
| `javascript:alert(1)` | `false` | Contains `:` |
| `` (empty string) | `false` | Does not start with `/` |
| `workspaces/123` | `false` | Relative path, no leading `/` |
| `../etc/passwd` | `false` | Relative path, no leading `/` |

### Property-Based Tests — add to `proxy.property.test.ts`

#### `makeRequest` helper update

The existing `makeRequest(pathname, options)` helper constructs `new URL(pathname, BASE_URL)`. Since `URL` accepts a full path-with-search string (e.g. `/signin?redirect=%2Fworkspaces`), the helper already supports query strings when passed as part of `pathname`. No signature change is strictly required — callers can pass `/signin?redirect=%2Fworkspaces%2F123` as the `pathname` argument.

However, to make test intent clearer and support hash fragments (which `URL` constructor handles correctly), add an optional `search` field to the options object:

```typescript
function makeRequest(
  pathname: string,
  options: {
    authHeader?: string;
    jwtCookie?: string;
    sessionCookie?: string;
    activeWorkspaceCookie?: string;
    search?: string;   // NEW: query string, e.g. "?tab=members"
    hash?: string;     // NEW: hash fragment, e.g. "#section"
  } = {},
): NextRequest {
  const url = new URL(pathname + (options.search ?? "") + (options.hash ?? ""), BASE_URL);
  // ... rest unchanged
}
```

This keeps the existing 6 properties working without modification while enabling the new properties to construct requests with query strings and hash fragments.

#### New arbitraries needed

```typescript
/** Generates a safe internal redirect path (starts with /, no protocol). */
const safeRedirectPathArb = fc.oneof(
  fc.constant("/workspaces"),
  snowflakeArb.map((id) => `/workspaces/${id}`),
  snowflakeArb.map((id) => `/channels/${id}`),
  snowflakeArb.map((id) => `/workspaces/${id}?tab=members`),
);

/** Generates an unsafe redirect value (external URL or protocol-relative). */
const unsafeRedirectArb = fc.oneof(
  fc.constant("//evil.com"),
  fc.constant("http://evil.com"),
  fc.constant("https://evil.com/path"),
  fc.constant("javascript:alert(1)"),
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.startsWith("/")),
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
```

#### Property 7: Bug Condition 1 fix — auth route respects safe redirect param

```
describe("Property 7: Auth route respects safe redirect param", () => {
  it(
    "redirects to the redirect param value for authenticated /signin requests with a safe redirect",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          safeRedirectPathArb,
          fc.option(snowflakeArb),   // optional active_workspace_id cookie
          async (userId, redirectPath, workspaceId) => {
            const token = await signToken({ sub: userId }, 60 * 15);
            const encodedRedirect = encodeURIComponent(redirectPath);
            const request = makeRequest(`/signin?redirect=${encodedRedirect}`, {
              authHeader: `Bearer ${token}`,
              activeWorkspaceCookie: workspaceId ?? undefined,
            });

            const response = await proxy(request);

            expect(isRedirect(response)).toBe(true);
            // The redirect target must be the decoded redirect param value.
            const location = new URL(response.headers.get("location")!);
            expect(location.pathname).toBe(new URL(redirectPath, BASE_URL).pathname);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
```

**What it tests**: For all authenticated requests to `/signin` with a safe `redirect` param, the proxy redirects to that param value regardless of whether an `active_workspace_id` cookie is present.

#### Property 8: Bug Condition 2 fix — protected route redirect includes return path

```
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
        { numRuns: 100 },
      );
    },
  );
});
```

**What it tests**: For all unauthenticated requests to protected routes where rotation fails, the redirect goes to `/signin` and the `redirect` param contains the full original path (pathname + search + hash).

#### Property 9: Preservation — root auth route ignores redirect param

```
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
        { numRuns: 100 },
      );
    },
  );
});
```

**What it tests**: Authenticated requests to `/` with a `redirect` param still redirect to the workspace destination — the root route is not a sign-in entry point and must not be affected by the BC1 fix.

#### Property 10: Preservation — open redirect prevention falls back to workspace

```
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
            const request = makeRequest(`/signin?redirect=${encodedRedirect}`, {
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
        { numRuns: 100 },
      );
    },
  );
});
```

**What it tests**: Authenticated requests to `/signin` with unsafe `redirect` values (external URLs, protocol-relative paths, relative paths) fall back to the workspace redirect — open redirect prevention is enforced.

### Integration Tests

- Full sign-in flow: unauthenticated user visits `/workspaces/123`, gets redirected to `/signin?redirect=%2Fworkspaces%2F123`, signs in, and is navigated to `/workspaces/123`
- Unsafe redirect rejected end-to-end: user manually crafts `/signin?redirect=https%3A%2F%2Fevil.com`, signs in, and is navigated to `/workspaces` (not the external URL)
- Root route unaffected: authenticated user visits `/?redirect=%2Fworkspaces%2F123` and is redirected to their workspace, not `/workspaces/123`
