---
inclusion: fileMatch
fileMatchPattern: ['apps/web/proxy.ts', 'apps/web/tests/proxy/**', 'apps/web/tests/identity/**', 'apps/web/app/**', 'apps/web/lib/identity/auth.ts']
---

# Implementation Plan: App Router Shell

## Overview

Establish the foundational Next.js App Router structure for MiniSlack: root layout with Geist fonts and TailwindCSS 4, route group directories (`(landing)`, `(auth)`, `(app)`) with placeholder pages and layouts, `proxy.ts` for JWT verification and token rotation on the Edge Runtime, and the Better Auth `after` hook for new-user detection. Each task builds on the previous — no orphaned code.

## Key Constraints

- `proxy.ts` runs on the **Next.js Edge Runtime** — do NOT import Node.js-only modules (`postgres.js`, Drizzle, `server-only`, `fs`, `path`, etc.). JWT verification uses `jose` (Web Crypto API).
- JWT is read from the `Authorization: Bearer <token>` header for fetch calls; falls back to a `jwt` cookie for SSR navigations.
- The `active_workspace_id` cookie is set by client-side JS and read by the proxy to construct the returning-user redirect URL.
- New-user detection (`/welcome` redirect) is handled entirely in the Better Auth `after` hook in `auth.ts` — the proxy does NOT query the database.
- Run all tests with `npm run test` from the **monorepo root** using the workspace flag, or directly in `apps/web`. Test runner is **Vitest** (`vitest run`). Property tests use **fast-check** (min 100 runs per property).
- Path aliases: `@/` resolves to `apps/web/` (configured in `vitest.config.ts` and `tsconfig.json`).

## Tasks

- [x] 1. Update root layout and global styles
  - Update `apps/web/app/layout.tsx`: set `metadata.title` to `"MiniSlack"` with an appropriate description, load Geist Sans and Geist Mono via `next/font/google` with CSS variable names, import `globals.css`, set `<html lang="en">`, apply `antialiased` class on `<body>`.
  - Update `apps/web/app/globals.css`: ensure `@theme inline` block maps `--font-sans` and `--font-mono` to the Geist CSS variables; keep existing TailwindCSS 4 import.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create route group structure and placeholder pages
  - [x] 2.1 Create `(landing)` route group
    - `apps/web/app/(landing)/layout.tsx` — full-width container, renders `children` directly.
    - Move or create `apps/web/app/(landing)/page.tsx` as the `/` landing page placeholder.
    - _Requirements: 2.1, 2.4, 2.5, 10.1, 10.2, 10.3_

  - [x] 2.2 Create `(auth)` route group
    - `apps/web/app/(auth)/layout.tsx` — centred layout: `min-h-screen flex items-center justify-center`, renders `children` in a centred wrapper.
    - `apps/web/app/(auth)/signin/page.tsx` — placeholder for `/signin`.
    - `apps/web/app/(auth)/welcome/page.tsx` — placeholder for `/welcome`.
    - _Requirements: 2.2, 2.4, 2.5, 9.1, 9.2, 9.3_

  - [x] 2.3 Create `(app)` route group
    - `apps/web/app/(app)/layout.tsx` — structural container (`flex h-screen`), renders `children`; sidebar added in Milestone 4.
    - `apps/web/app/(app)/workspaces/page.tsx` — placeholder for `/workspaces`.
    - _Requirements: 2.3, 2.4, 2.5, 8.1, 8.2, 8.3_

- [x] 3. Implement proxy helpers and pure logic
  - Create `apps/web/proxy.ts` exporting `proxy` (not `middleware`) and `config` with matcher `['/((?!_next/static|_next/image|favicon.ico|api/auth).*)']`.
  - `verifyJwt(token: string): Promise<JwtPayload | null>` — uses `jose` (`jwtVerify`) with `JWT_SECRET` env var; returns decoded payload or `null` on any error (expired, malformed, wrong secret). Logs a warning in development if `JWT_SECRET` is unset.
  - `isProtectedRoute(pathname: string): boolean` — `true` for `/workspaces`, `/workspaces/*`, `/channels/*`.
  - `isAuthRoute(pathname: string): boolean` — `true` for `/signin` and `/` only.
  - `JwtPayload` interface: `{ sub: string; exp: number; iat: number }`.
  - _Requirements: 3.1–3.5, 4.1–4.4_

  - [x] 3.1 Write unit tests for proxy pure helpers
    - File: `apps/web/tests/proxy/helpers.test.ts`
    - `verifyJwt`: valid token, expired token, malformed token, wrong secret, missing `JWT_SECRET`.
    - `isProtectedRoute`: `/workspaces`, `/workspaces/123`, `/channels/456`, `/signin`, `/`, `/_next/static/foo`, `/api/auth/signin`.
    - `isAuthRoute`: `/signin`, `/`, `/welcome`, `/workspaces`.
    - _Requirements: 3.1, 3.5, 4.1_

- [x] 4. Implement proxy redirect logic
  - `rotateToken(request: NextRequest): Promise<string | null>` — POSTs to `/api/auth/refresh` forwarding the `better-auth.session_token` cookie; returns new JWT string on 2xx or `null` on failure/network error.
  - Main `proxy(request: NextRequest): Promise<NextResponse>` logic:
    1. Extract JWT from `Authorization: Bearer` header, then fall back to `jwt` cookie.
    2. Call `verifyJwt`; on failure attempt `rotateToken`.
    3. `isAuthRoute(pathname)` + valid JWT → redirect to `/workspaces/<active_workspace_id>` (from cookie) or `/workspaces`.
    4. `isProtectedRoute(pathname)` + no valid JWT after rotation → redirect to `/signin`.
    5. `isProtectedRoute(pathname)` + rotation succeeded → `NextResponse.next()` with new JWT as `Set-Cookie` (`httpOnly: false`, `sameSite: lax`, `secure` in production).
    6. Default → `NextResponse.next()`.
  - _Requirements: 4.1–4.5, 5.1–5.5, 6.1, 6.3–6.5_

  - [x] 4.1 Property 1: Protected routes require authentication
    - File: `apps/web/tests/proxy/proxy.property.test.ts`
    - Generator: random paths from `/workspaces`, `/workspaces/<snowflake-id>`, `/channels/<snowflake-id>`; no JWT, no session cookie; mock `fetch` to return 401.
    - Assert: redirect to `/signin`. Min 100 runs.
    - _Validates: Requirements 4.4, 5.4, 5.5, 6.5_

  - [x] 4.2 Property 2: Valid JWT allows protected route access
    - Generator: random protected paths + random valid (non-expired) JWT payloads with varying user IDs.
    - Assert: response is NOT a redirect. Min 100 runs.
    - _Validates: Requirement 4.1_

  - [x] 4.3 Property 3: Token rotation preserves access
    - Generator: random protected paths + expired JWT payloads + valid session cookie; mock `fetch` (`/api/auth/refresh`) to return a new JWT.
    - Assert: NOT a redirect AND `set-cookie` header contains `jwt=<new-token>`. Min 100 runs.
    - _Validates: Requirements 4.3, 5.1–5.3_

  - [x] 4.4 Property 4: Failed token rotation redirects to sign-in
    - Generator: random protected paths + random non-2xx status codes (400, 401, 403, 500) OR network errors; mock `fetch` to fail.
    - Assert: redirect to `/signin`. Min 100 runs (two `it` blocks: one for non-2xx, one for network error).
    - _Validates: Requirements 4.4, 5.4, 5.5_

  - [x] 4.5 Property 5: Authenticated users redirected away from auth routes
    - Generator: random valid JWT payloads + random Snowflake IDs as `active_workspace_id` cookie; request to `/signin` or `/`.
    - Assert: redirect to `/workspaces/<active_workspace_id>` when cookie present, `/workspaces` when absent. Min 100 runs (two `it` blocks).
    - _Validates: Requirements 6.1, 6.3, 6.4_

  - [x] 4.6 Property 6: Excluded paths pass through unmodified
    - Generator: random suffixes appended to `/_next/static/`, `/_next/image/`, `/api/auth/`; also `/favicon.ico`; with or without JWT.
    - Assert: NOT a redirect AND `set-cookie` is null. Min 100 runs.
    - _Validates: Requirements 3.1, 3.5_

- [ ] 5. Checkpoint — run proxy tests
  - Run `npm run test --workspace=apps/web` from the monorepo root (or `npm run test` inside `apps/web`).
  - Confirm all proxy helper and property tests pass before proceeding.
  - Fix any failures before moving to task 6.

- [-] 6. Update Better Auth hook for new-user detection
  - File: `apps/web/lib/identity/auth.ts`
  - The `after` hook (using `createAuthMiddleware`) must fire on `ctx.path === "/magic-link/verify"` and `ctx.path.startsWith("/callback")`.
  - When the session exists, query `workspaceMembers` filtered by `session.user.id` using Drizzle (`eq`). If zero rows → `throw ctx.redirect("/welcome")`.
  - The proxy does NOT handle new-user detection — this hook is the sole mechanism.
  - _Requirements: 7.1–7.4_

  - [ ] 6.1 Write integration tests for Better Auth new-user hook
    - File: `apps/web/tests/identity/auth-hook.test.ts`
    - Mock `@/lib/db.ts` and `@/lib/mail.ts` before importing `auth.ts` (use `vi.mock`).
    - Extract the hook handler via `(auth as any).options.hooks.after.handler` (or the unwrapped function if `createAuthMiddleware` exposes it differently).
    - Build a minimal `ctx` object with `{ path, context: { session }, redirect }` — only fields the hook reads.
    - Test cases:
      - `/magic-link/verify` + 0 memberships → throws redirect to `/welcome`.
      - `/magic-link/verify` + ≥1 membership → resolves without throwing.
      - `/magic-link/verify` + no session → resolves without throwing.
      - `/callback/github` + 0 memberships → throws redirect to `/welcome`.
      - `/callback/github` + ≥1 membership → resolves without throwing.
      - `/callback/google` (any `/callback/*`) + 0 memberships → throws redirect to `/welcome`.
      - Unrelated paths (`/sign-in/email`, `/sign-out`) + 0 memberships → resolves without throwing.
      - DB query correctness: `fromMock` called with `schema.workspaceMembers`; `whereMock` called with `eq(schema.workspaceMembers.userId, userId)`.
    - _Requirements: 7.1, 7.3, 7.4_

- [x] 7. Install `jose` and `fast-check` dependencies
  - `jose` in `dependencies` (Edge Runtime compatible JWT verification).
  - `fast-check` in `devDependencies` (property-based testing).
  - Run `npm install` in `apps/web` (or from monorepo root with workspace flag).
  - _Requirements: 4.1–4.3_
  > **Note**: Must be completed before tasks 3 and 4. Both packages are already present in `apps/web/package.json` as of the current implementation.

- [ ] 8. Final checkpoint — full test suite
  - Run `npm run test --workspace=apps/web` from the monorepo root.
  - All tests must pass: proxy helpers, property tests, auth hook integration tests, and all pre-existing tests (channels, messages, workspaces, invitations, etc.).
  - Fix any failures before marking complete.

## Notes

- **Monorepo commands**: always run from the root with `--workspace=apps/web` or `npm run test` inside `apps/web`. Never `cd` into subdirectories in shell commands.
- **Edge Runtime restriction**: `proxy.ts` must not import `postgres.js`, Drizzle, `server-only`, or any Node.js built-in. Only Web APIs and `jose` are safe.
- **JWT storage**: JWT is in-memory on the client (not persisted). Sent via `Authorization: Bearer` header on fetch calls; falls back to `jwt` cookie for SSR navigations.
- **Cookie names**: `better-auth.session_token` (HttpOnly, SameSite=Lax — the refresh token), `active_workspace_id` (SameSite=Lax, readable by proxy), `jwt` (SameSite=Lax, readable by client JS).
- **Task ordering**: Task 7 (install deps) must precede tasks 3 and 4 in execution. Both packages are already installed.
- **Optional tasks**: Tasks marked `*` are optional and can be skipped for a faster MVP. No optional tasks exist in this spec.
- **Test helpers**: `apps/web/tests/helpers/` contains `db.ts` (PGlite in-memory DB), `router-test.ts` (RPC router test utilities), and `server-only-mock.ts` (mocks the `server-only` package for test environments).
