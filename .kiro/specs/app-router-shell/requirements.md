# Requirements Document

## Introduction

The App Router Shell establishes the foundational Next.js App Router structure for MiniSlack. It introduces the route group layout (`(landing)`, `(auth)`, `(app)`), updates the root layout with the correct fonts and global styles, and implements the authentication proxy (`proxy.ts`) that verifies JWTs, rotates tokens, and enforces redirect logic — sending new users to `/welcome` and returning users to their last active workspace.

This is the entry point for all authenticated and unauthenticated navigation in the application. The milestone goal is: a user can sign in and be redirected to the correct destination.

## Glossary

- **Proxy**: The Next.js `proxy.ts` file that runs before a request reaches a route handler or page (renamed from `middleware.ts` in Next.js 16; functionality is identical).
- **JWT**: JSON Web Token — a short-lived (15 min) access token stored in memory on the client, containing only the User ID.
- **Refresh Token**: A long-lived (7 day) token stored in an `HttpOnly; SameSite=Lax` cookie, used to obtain a new JWT without re-authentication.
- **Token Rotation**: The process of exchanging an expired or near-expired JWT for a new one using the Refresh Token via `POST /api/auth/refresh`.
- **Route Group**: A Next.js App Router directory wrapped in parentheses (e.g., `(auth)`) that organises routes without affecting the URL path.
- **Better Auth**: The authentication library managing Magic Link and GitHub OAuth flows, session storage, and the `/api/auth/[...all]` handler.
- **New User**: A user who has no workspace memberships after successful authentication.
- **Returning User**: A user who has at least one workspace membership after successful authentication.
- **Active Workspace**: The workspace a returning user was last working in, identified by `active_workspace_id` stored in `localStorage`.
- **Root Layout**: The `apps/web/app/layout.tsx` file that wraps every page in the application.
- **Protected Route**: Any route under the `(app)` route group that requires a valid, authenticated session.
- **Public Route**: Any route under `(landing)` or `(auth)` that is accessible without authentication.

---

## Requirements

### Requirement 1: Root Layout

**User Story:** As a developer, I want a root layout that applies consistent fonts and global styles, so that every page in the application shares a unified visual baseline.

#### Acceptance Criteria

1. THE Root_Layout SHALL apply the Geist Sans and Geist Mono variable fonts to the `<html>` element via CSS custom properties.
2. THE Root_Layout SHALL import `globals.css` to apply TailwindCSS 4 base styles globally.
3. THE Root_Layout SHALL set the `<html>` element `lang` attribute to `"en"`.
4. THE Root_Layout SHALL export a `metadata` object with a `title` of `"MiniSlack"` and a `description` appropriate for the product.
5. THE Root_Layout SHALL render a `<body>` element with the `antialiased` Tailwind utility class applied.

---

### Requirement 2: Route Group Structure

**User Story:** As a developer, I want the app organised into route groups, so that each section of the application can have its own layout, middleware behaviour, and visual treatment without polluting the URL structure.

#### Acceptance Criteria

1. THE App_Router SHALL provide a `(landing)` route group containing the root path `/`.
2. THE App_Router SHALL provide an `(auth)` route group containing at minimum the paths `/signin` and `/welcome`.
3. THE App_Router SHALL provide an `(app)` route group containing authenticated paths including `/workspaces`.
4. WHEN a route belongs to a route group, THE App_Router SHALL not include the group name in the URL path.
5. THE App_Router SHALL allow each route group to define its own `layout.tsx` independently of the other groups.

---

### Requirement 3: Proxy — Route Matching

**User Story:** As a developer, I want the proxy to run only on relevant routes, so that static assets and the Better Auth API handler are not intercepted unnecessarily.

#### Acceptance Criteria

1. THE Proxy SHALL apply to all request paths except those matching `/_next/static/(.*)`, `/_next/image/(.*)`, `/favicon.ico`, and `/api/auth/(.*)`.
2. THE Proxy SHALL apply to all paths under the `(app)` route group.
3. THE Proxy SHALL apply to all paths under the `(auth)` route group.
4. THE Proxy SHALL apply to all paths under the `(landing)` route group.
5. WHEN a request path matches an excluded pattern, THE Proxy SHALL pass the request through without modification.

---

### Requirement 4: Proxy — JWT Verification

**User Story:** As a security engineer, I want the proxy to verify the JWT on every protected request, so that unauthenticated users cannot access application routes.

#### Acceptance Criteria

1. WHEN a request arrives for a protected route and a valid JWT is present in the request, THE Proxy SHALL allow the request to proceed.
2. WHEN a request arrives for a protected route and no JWT is present, THE Proxy SHALL check for a Refresh Token cookie before redirecting.
3. WHEN a request arrives for a protected route and the JWT is expired, THE Proxy SHALL attempt token rotation before redirecting.
4. IF JWT verification fails and token rotation also fails, THEN THE Proxy SHALL redirect the request to `/signin`.
5. WHEN a request arrives for a public route (`(landing)` or `(auth)`), THE Proxy SHALL allow the request to proceed regardless of authentication state.

---

### Requirement 5: Proxy — Token Rotation

**User Story:** As a user, I want my session to be silently renewed when my access token expires, so that I am not unexpectedly logged out during active use.

#### Acceptance Criteria

1. WHEN the JWT is absent or expired and a Refresh Token cookie is present, THE Proxy SHALL call `POST /api/auth/refresh` to obtain a new JWT.
2. WHEN token rotation succeeds, THE Proxy SHALL attach the new JWT to the outgoing response so the client can store it in memory.
3. WHEN token rotation succeeds, THE Proxy SHALL allow the original request to proceed with the new JWT.
4. IF the `POST /api/auth/refresh` call returns a non-2xx response, THEN THE Proxy SHALL treat the session as invalid and redirect to `/signin`.
5. IF the `POST /api/auth/refresh` call throws a network error, THEN THE Proxy SHALL treat the session as invalid and redirect to `/signin`.

---

### Requirement 6: Proxy — Post-Authentication Redirect

**User Story:** As a user, I want to be sent to the right place after signing in, so that I land directly in my workspace or am guided through onboarding if I am new.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to `/signin` or `/`, THE Proxy SHALL redirect the user away from those pages to avoid showing the sign-in form to already-authenticated users.
2. WHEN a newly authenticated user has no workspace memberships, THE Proxy SHALL redirect the user to `/welcome`.
3. WHEN a returning authenticated user has an `active_workspace_id` value available, THE Proxy SHALL redirect the user to `/workspaces/[active_workspace_id]`.
4. WHEN a returning authenticated user has no `active_workspace_id` value available, THE Proxy SHALL redirect the user to `/workspaces` to select a workspace.
5. WHEN an unauthenticated user navigates to a protected route under `(app)`, THE Proxy SHALL redirect the user to `/signin`.

---

### Requirement 7: Proxy — New User Detection

**User Story:** As a product manager, I want new users to be routed to the onboarding flow, so that they are guided to create or join a workspace before accessing the application.

#### Acceptance Criteria

1. WHEN a user completes authentication via Magic Link or GitHub OAuth and has zero workspace memberships, THE Auth_Hook SHALL redirect the user to `/welcome`.
2. WHEN the Proxy processes a request from an authenticated user with a valid JWT, THE Proxy SHALL treat the user as a returning user and apply returning-user redirect logic.
3. THE Auth_Hook SHALL determine new-user status by querying the `workspace_members` table for the authenticated user's ID.
4. IF the `workspace_members` query returns zero rows for the authenticated user, THEN THE Auth_Hook SHALL issue a redirect to `/welcome`.

---

### Requirement 8: (app) Route Group Layout

**User Story:** As a developer, I want the `(app)` route group to have its own layout, so that authenticated pages can share chrome (e.g., sidebar, navigation) without affecting public pages.

#### Acceptance Criteria

1. THE App_Layout SHALL wrap all routes under the `(app)` route group.
2. THE App_Layout SHALL render its `children` prop within a structural container element.
3. WHEN a user navigates between routes within the `(app)` group, THE App_Layout SHALL persist without full re-mount.

---

### Requirement 9: (auth) Route Group Layout

**User Story:** As a developer, I want the `(auth)` route group to have its own layout, so that authentication pages can share a consistent centred card layout without affecting other sections.

#### Acceptance Criteria

1. THE Auth_Layout SHALL wrap all routes under the `(auth)` route group.
2. THE Auth_Layout SHALL render its `children` prop within a centred layout container.
3. WHEN a user navigates between routes within the `(auth)` group, THE Auth_Layout SHALL persist without full re-mount.

---

### Requirement 10: (landing) Route Group Layout

**User Story:** As a developer, I want the `(landing)` route group to have its own layout, so that the marketing page can have a distinct visual treatment from the app and auth pages.

#### Acceptance Criteria

1. THE Landing_Layout SHALL wrap all routes under the `(landing)` route group.
2. THE Landing_Layout SHALL render its `children` prop within a full-width layout container.
3. WHEN a user navigates to `/`, THE Landing_Layout SHALL be applied.
