# Bugfix Requirements Document

## Introduction

The proxy middleware (`apps/web/proxy.ts`) handles two redirect scenarios involving the `/signin` route and a `?redirect=` query parameter. Both scenarios are currently broken:

1. When an already-authenticated user visits `/signin?redirect=/some/path`, the proxy ignores the `redirect` parameter and sends them to their workspace (or `/workspaces`) instead of the intended destination.
2. When an unauthenticated user tries to access a protected route (e.g. `/workspaces/123`), the proxy redirects them to `/signin` without appending a `?redirect=/workspaces/123` parameter, making it impossible to return them to their original destination after sign-in.

Both issues break the expected sign-in flow and degrade the user experience for deep-linked navigation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an authenticated user visits `/signin` with a valid `?redirect=<path>` query parameter THEN the system redirects them to their active workspace (or `/workspaces`) and ignores the `redirect` parameter

1.2 WHEN an authenticated user visits `/` with a valid `?redirect=<path>` query parameter THEN the system redirects them to their active workspace (or `/workspaces`) and ignores the `redirect` parameter

1.3 WHEN an unauthenticated user visits a protected route (e.g. `/workspaces/123`) THEN the system redirects them to `/signin` without appending a `?redirect=` query parameter containing the original path

### Expected Behavior (Correct)

2.1 WHEN an authenticated user visits `/signin` with a valid `?redirect=<path>` query parameter THEN the system SHALL redirect them directly to the path specified in the `redirect` parameter instead of their workspace

2.2 WHEN an authenticated user visits `/signin` with a `?redirect=<path>` query parameter that points to an external or unsafe URL THEN the system SHALL ignore the `redirect` parameter and fall back to the default workspace redirect (open redirect prevention)

2.3 WHEN an authenticated user visits `/signin` with no `?redirect=` parameter THEN the system SHALL redirect them to their active workspace (or `/workspaces`) as before

2.4 WHEN an authenticated user visits `/` (root auth route) THEN the system SHALL redirect them to their active workspace (or `/workspaces`) regardless of any query parameters, since `/` is not a sign-in entry point

2.5 WHEN an unauthenticated user visits a protected route THEN the system SHALL redirect them to `/signin?redirect=<encoded-full-path>` where `<encoded-full-path>` is the URL-encoded combination of the original pathname, search params, and fragment (e.g. `/workspaces/123?tab=members#section` → `/signin?redirect=%2Fworkspaces%2F123%3Ftab%3Dmembers%23section`)

2.6 WHEN the proxy appends or preserves a `redirect` param, the proxy's responsibility ends — post-authentication redirection (reading the `redirect` param and navigating the user after sign-in) is handled exclusively by the signin page, not the proxy

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an authenticated user visits `/signin` with no `?redirect=` parameter THEN the system SHALL CONTINUE TO redirect them to `/workspaces/<active_workspace_id>` when the `active_workspace_id` cookie is present

3.2 WHEN an authenticated user visits `/signin` with no `?redirect=` parameter THEN the system SHALL CONTINUE TO redirect them to `/workspaces` when the `active_workspace_id` cookie is absent

3.3 WHEN an unauthenticated user visits a protected route and token rotation succeeds THEN the system SHALL CONTINUE TO pass the request through with the new JWT cookie set (no redirect)

3.4 WHEN an unauthenticated user visits a protected route and token rotation fails THEN the system SHALL CONTINUE TO redirect them to sign-in (now with the `?redirect=` parameter appended per 2.5)

3.5 WHEN any user visits an excluded path (static assets, `/api/auth/*`, `/favicon.ico`) THEN the system SHALL CONTINUE TO pass the request through without any redirect or cookie mutation

3.6 WHEN a user with a valid JWT visits a protected route THEN the system SHALL CONTINUE TO pass the request through without redirecting

---

## Bug Condition Pseudocode

### Bug Condition 1 — Ignored redirect param on auth route

```pascal
FUNCTION isBugCondition1(X)
  INPUT: X of type ProxyRequest
  OUTPUT: boolean

  RETURN X.pathname = "/signin"
    AND isAuthenticated(X)
    AND X.searchParams.has("redirect")
    AND isSafeInternalPath(X.searchParams.get("redirect"))
END FUNCTION
```

**Property: Fix Checking — Auth route respects redirect param**
```pascal
FOR ALL X WHERE isBugCondition1(X) DO
  result ← proxy'(X)
  ASSERT isRedirect(result)
    AND redirectTarget(result) = X.searchParams.get("redirect")
END FOR
```

**Preservation Goal:**
```pascal
FOR ALL X WHERE NOT isBugCondition1(X) DO
  ASSERT proxy(X) = proxy'(X)
END FOR
```

---

### Bug Condition 2 — Missing redirect param on protected route redirect

```pascal
FUNCTION isBugCondition2(X)
  INPUT: X of type ProxyRequest
  OUTPUT: boolean

  RETURN isProtectedRoute(X.pathname)
    AND NOT isAuthenticated(X)
    AND rotationFails(X)
END FUNCTION
```

**Property: Fix Checking — Protected route redirect includes return path**
```pascal
FOR ALL X WHERE isBugCondition2(X) DO
  result ← proxy'(X)
  fullPath ← X.pathname + X.search + X.hash
  ASSERT isRedirect(result)
    AND redirectTarget(result).pathname = "/signin"
    AND redirectTarget(result).searchParams.get("redirect") = fullPath
END FOR
```

**Preservation Goal:**
```pascal
FOR ALL X WHERE NOT isBugCondition2(X) DO
  ASSERT proxy(X) = proxy'(X)
END FOR
```
