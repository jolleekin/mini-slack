# Implementation Plan

- [x] 1. Write bug condition exploration tests (BEFORE implementing the fix)
  - **Property 1: Bug Condition** - Ignored redirect param and missing redirect on protected route
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist before any code is changed
  - Add a new `describe` block titled `"Bug Condition Exploration"` to `apps/web/tests/proxy/proxy.property.test.ts`
  - **BC1 test**: Construct an authenticated request to `/signin?redirect=%2Fworkspaces%2F123` (valid JWT in `Authorization` header); assert `isRedirect(response)` is `true` and `new URL(response.headers.get("location")!).pathname` equals `/workspaces/123` — on unfixed code this will FAIL because the proxy redirects to the workspace cookie destination instead
  - **BC2 test**: Construct an unauthenticated request to `/workspaces/123` with a session cookie and mock `fetch` to return `401`; assert `isRedirect(response)` is `true`, `new URL(response.headers.get("location")!).pathname` equals `/signin`, and `new URL(response.headers.get("location")!).searchParams.get("redirect")` equals `/workspaces/123` — on unfixed code this will FAIL because the proxy redirects to bare `/signin` with no `redirect` param
  - Run both tests on UNFIXED code
  - **EXPECTED OUTCOME**: Both tests FAIL (this is correct — it proves both bugs exist)
  - Document the counterexamples observed (e.g. "BC1: location is `/workspaces` instead of `/workspaces/123`; BC2: location is `/signin` with no `redirect` param")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.3_

- [x] 2. Implement the fix

  - [x] 2.1 Add `isSafeRedirectPath` exported helper to `apps/web/proxy.ts`
    - Add the function immediately after the `isAuthRoute` function
    - Signature: `export function isSafeRedirectPath(path: string): boolean`
    - Logic: `return path.startsWith("/") && !path.startsWith("//") && !path.includes(":")`
    - Export it so it can be imported in `helpers.test.ts` and in the signin page
    - _Bug_Condition: prerequisite for both isBugCondition1 and isBugCondition2 fixes_
    - _Expected_Behavior: isSafeRedirectPath(path) returns true iff path starts with "/" AND does not start with "//" AND does not contain ":"_
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Patch step 4 of `proxy()` — split `/signin` vs `/` handling
    - In the `isAuthRoute(pathname) && isAuthenticated` branch, replace the single unified block with two separate branches: one for `pathname === "/signin"` and one for `pathname === "/"`
    - For `pathname === "/signin"`: read `request.nextUrl.searchParams.get("redirect")`; if the value is non-null and `isSafeRedirectPath(redirectParam)` returns `true`, use `redirectParam` as the destination; otherwise fall back to the workspace cookie destination (`/workspaces/<id>` or `/workspaces`)
    - For `pathname === "/"`: keep the existing unconditional workspace redirect — the root route is not a sign-in entry point and must never honour a `redirect` param
    - _Bug_Condition: isBugCondition1 — X.pathname = "/signin" AND isAuthenticated(X) AND X.searchParams.has("redirect") AND isSafeRedirectPath(X.searchParams.get("redirect"))_
    - _Expected_Behavior: redirectTarget(result) = X.searchParams.get("redirect")_
    - _Preservation: root "/" route continues to redirect to workspace regardless of query params (requirement 2.4); no-param /signin continues to redirect to workspace (requirements 3.1, 3.2)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

  - [x] 2.3 Patch step 5 of `proxy()` — append `redirect` param on protected route redirect
    - In the `isProtectedRoute(pathname) && !isAuthenticated` branch, replace `new URL("/signin", request.url)` with a URL that includes the full return path as a `redirect` query param
    - Build the full return path: `const { pathname: pn, search, hash } = request.nextUrl; const fullPath = pn + search + hash`
    - Construct the sign-in URL: `const signinUrl = new URL("/signin", request.url); signinUrl.searchParams.set("redirect", fullPath)`
    - Return `NextResponse.redirect(signinUrl)` — `searchParams.set()` handles percent-encoding automatically
    - _Bug_Condition: isBugCondition2 — isProtectedRoute(X.pathname) AND NOT isAuthenticated(X) AND rotationFails(X)_
    - _Expected_Behavior: redirectTarget(result).pathname = "/signin" AND redirectTarget(result).searchParams.get("redirect") = X.pathname + X.search + X.hash_
    - _Preservation: rotation-success pass-through is in a separate branch and is unaffected (requirement 3.3)_
    - _Requirements: 2.5, 3.3, 3.4_

  - [x] 2.4 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Ignored redirect param and missing redirect on protected route
    - **IMPORTANT**: Re-run the SAME tests written in task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for both bug conditions
    - When these tests pass, it confirms both bugs are fixed
    - Run the `"Bug Condition Exploration"` describe block from `proxy.property.test.ts`
    - **EXPECTED OUTCOME**: Both BC1 and BC2 tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.5_

- [x] 3. Write fix-checking and preservation property tests (AFTER implementing the fix)
  - **Property 2: Preservation** - Full fix-checking and preservation suite
  - **IMPORTANT**: Follow observation-first methodology — run the fixed code and observe outputs before writing assertions
  - All tests in this task run on FIXED code and are expected to PASS
  - **EXPECTED OUTCOME**: All tests PASS (confirms fix is correct and no regressions introduced)

  - [x] 3.1 Add unit tests for `isSafeRedirectPath` to `apps/web/tests/proxy/helpers.test.ts`
    - Import `isSafeRedirectPath` from `@/proxy.ts` alongside the existing imports
    - Add a new `describe("isSafeRedirectPath", ...)` block with the following 11 cases:
      - `/workspaces` → `true` (valid internal path)
      - `/workspaces/123` → `true` (valid internal path with segment)
      - `/channels/456` → `true` (valid internal path)
      - `/workspaces/123?tab=members` → `true` (valid path with query string)
      - `//evil.com` → `false` (protocol-relative URL — open redirect)
      - `http://evil.com` → `false` (absolute URL with protocol)
      - `https://evil.com/path` → `false` (absolute URL with protocol)
      - `javascript:alert(1)` → `false` (contains `:`)
      - `""` (empty string) → `false` (does not start with `/`)
      - `workspaces/123` → `false` (relative path, no leading `/`)
      - `../etc/passwd` → `false` (relative path, no leading `/`)
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Update `makeRequest` helper in `proxy.property.test.ts` to accept `search` and `hash` options
    - Add `search?: string` and `hash?: string` to the options type of `makeRequest`
    - Update the URL construction line to: `const url = new URL(pathname + (options.search ?? "") + (options.hash ?? ""), BASE_URL)`
    - All existing callers pass no `search` or `hash` so they are unaffected
    - _Requirements: 2.5_

  - [x] 3.3 Add new arbitraries to `proxy.property.test.ts`
    - Add `safeRedirectPathArb` — generates safe internal redirect paths using `fc.oneof`: `fc.constant("/workspaces")`, `snowflakeArb.map((id) => \`/workspaces/${id}\`)`, `snowflakeArb.map((id) => \`/channels/${id}\`)`, `snowflakeArb.map((id) => \`/workspaces/${id}?tab=members\`)`
    - Add `unsafeRedirectArb` — generates unsafe redirect values using `fc.oneof`: `fc.constant("//evil.com")`, `fc.constant("http://evil.com")`, `fc.constant("https://evil.com/path")`, `fc.constant("javascript:alert(1)")`, `fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.startsWith("/"))`
    - Add `searchArb` — generates optional query strings: `fc.oneof(fc.constant(""), fc.constant("?tab=members"), snowflakeArb.map((id) => \`?workspace=${id}\`))`
    - Add `hashArb` — generates optional hash fragments: `fc.oneof(fc.constant(""), fc.constant("#section"), fc.constant("#top"))`
    - _Requirements: 2.1, 2.5_

  - [x] 3.4 Add Property 7 (BC1 fix check) to `proxy.property.test.ts`
    - Add `describe("Property 7: Auth route respects safe redirect param", ...)` block
    - Property: for all `(userId, redirectPath, workspaceId)` from `(userIdArb, safeRedirectPathArb, fc.option(snowflakeArb))` — sign a valid JWT, build `encodedRedirect = encodeURIComponent(redirectPath)`, call `makeRequest(\`/signin?redirect=${encodedRedirect}\`, { authHeader: \`Bearer ${token}\`, activeWorkspaceCookie: workspaceId ?? undefined })`; assert `isRedirect(response)` is `true` and `new URL(response.headers.get("location")!).pathname` equals `new URL(redirectPath, BASE_URL).pathname`
    - Use `{ numRuns: 100 }`
    - **EXPECTED OUTCOME**: PASSES on fixed code
    - _Requirements: 2.1_

  - [x] 3.5 Add Property 8 (BC2 fix check) to `proxy.property.test.ts`
    - Add `describe("Property 8: Protected route redirect includes return path", ...)` block
    - Property: for all `(pathname, search, hash)` from `(protectedPathArb, searchArb, hashArb)` — mock `fetch` to return `401`, call `makeRequest(pathname, { sessionCookie: "some-session-token", search, hash })`; assert `isRedirect(response)` is `true`, `new URL(response.headers.get("location")!).pathname` equals `"/signin"`, and `new URL(response.headers.get("location")!).searchParams.get("redirect")` equals `pathname + search + hash`
    - Use `{ numRuns: 100 }`
    - **EXPECTED OUTCOME**: PASSES on fixed code
    - _Requirements: 2.5_

  - [x] 3.6 Add Property 9 (root route preservation) to `proxy.property.test.ts`
    - Add `describe("Property 9: Root auth route ignores redirect param", ...)` block
    - Property: for all `(userId, workspaceId, redirectPath)` from `(userIdArb, fc.option(snowflakeArb), safeRedirectPathArb)` — sign a valid JWT, build `encodedRedirect = encodeURIComponent(redirectPath)`, call `makeRequest(\`/?redirect=${encodedRedirect}\`, { authHeader: \`Bearer ${token}\`, activeWorkspaceCookie: workspaceId ?? undefined })`; assert `isRedirect(response)` is `true` and `new URL(response.headers.get("location")!).pathname` equals `workspaceId ? \`/workspaces/${workspaceId}\` : "/workspaces"`
    - Use `{ numRuns: 100 }`
    - **EXPECTED OUTCOME**: PASSES on fixed code (confirms root route is unaffected by the BC1 fix)
    - _Requirements: 2.4, 3.1, 3.2_

  - [x] 3.7 Add Property 10 (open redirect prevention) to `proxy.property.test.ts`
    - Add `describe("Property 10: Open redirect prevention — unsafe redirect falls back to workspace", ...)` block
    - Property: for all `(userId, unsafeRedirect, workspaceId)` from `(userIdArb, unsafeRedirectArb, fc.option(snowflakeArb))` — sign a valid JWT, build `encodedRedirect = encodeURIComponent(unsafeRedirect)`, call `makeRequest(\`/signin?redirect=${encodedRedirect}\`, { authHeader: \`Bearer ${token}\`, activeWorkspaceCookie: workspaceId ?? undefined })`; assert `isRedirect(response)` is `true` and `new URL(response.headers.get("location")!).pathname` equals `workspaceId ? \`/workspaces/${workspaceId}\` : "/workspaces"`
    - Use `{ numRuns: 100 }`
    - **EXPECTED OUTCOME**: PASSES on fixed code (confirms unsafe redirect values are rejected)
    - _Requirements: 2.2, 2.3_

  - [x] 3.8 Verify all preservation tests pass
    - **Property 2: Preservation** - Full suite
    - **IMPORTANT**: Re-run the SAME tests from tasks 3.1–3.7 — do NOT write new tests
    - Run the full `proxy.property.test.ts` and `helpers.test.ts` suites
    - **EXPECTED OUTCOME**: All tests PASS (confirms fix is correct and no regressions)
    - Confirm Properties 1–6 (existing) still pass alongside the new Properties 7–10
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 4. Update signin page to consume the `redirect` param after authentication
  - Update `apps/web/app/(auth)/signin/page.tsx` to accept `searchParams` from Next.js App Router page props
  - Add `searchParams` prop typed as `Promise<{ redirect?: string }>` (Next.js 15+ passes `searchParams` as a Promise in async page components)
  - Await `searchParams` and read the `redirect` value
  - Import `isSafeRedirectPath` from `@/proxy.ts`
  - After successful authentication, validate the `redirect` value with `isSafeRedirectPath`; if valid, navigate to it using the router; otherwise fall back to `/workspaces`
  - The page must NOT redirect before authentication — the param is only consumed post-sign-in
  - Since the page is currently a stub with no auth UI, scaffold the param-reading logic and the post-auth navigation handler so it is ready when the auth UI is wired up
  - _Requirements: 2.6_

- [x] 5. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npm run test -w @mini-slack/web`
  - Ensure all tests pass, including the existing Properties 1–6 and the new Properties 7–10
  - Ensure `helpers.test.ts` passes including the new `isSafeRedirectPath` unit tests
  - Ask the user if any questions arise
