# Design Document: apps.web.localization

## Overview

This feature extends `apps/web` with full UI localization support, generalising the existing narrow error-message translation system (`apps/web/lib/errors/`) to cover all user-facing strings across the landing, auth, and app shell route groups.

The design reuses the `@mini-slack/i18n` `createTranslator()` utility and introduces two separate i18n modules — one for the landing/auth pages, one for the app shell — to enforce a clean catalog boundary that anticipates a future split into separate frontend apps.

### Key Design Decisions

**Proxy as the single locale resolution point.** The proxy (Next.js 16 `middleware.ts`) runs before every request. It detects the locale, sets a `locale` cookie, and performs any redirects. All downstream code reads the cookie. This eliminates per-route locale detection logic and ensures the cookie is always present and correct before any rendering happens.

**Two i18n modules, two catalogs.** The landing/auth pages and the app shell have different deployment and reuse needs. Structuring them as separate modules now (`lib/i18n/landing/` and `lib/i18n/app/`) makes the future split a file move rather than a refactor.

**Path-based routing for landing/auth, cookie-based for the app shell.** Landing and auth pages use a `[locale]` URL segment for distinct, crawlable URLs. The app shell (under `/app`, not indexed) uses the cookie.

**`/app` path prefix for the app shell.** The authenticated route group moves from `(app)` (no URL impact) to an explicit `/app` prefix. This creates a clean URL boundary for proxy dispatch, and makes a future subdomain split (`app.minislack.com`) a pure infrastructure change.

**Session-based protection for UI, JWT reserved for API.** The app proxy checks the Better Auth session cookie. JWT is reserved for when the API is extracted into a separate service or native apps are added.

**Server-first, context-optional for landing/auth.** Server Components call `getTranslator(locale)` directly — no provider needed. The locale comes from the cookie read via `headers()`.

**Thin client context for the app shell.** `<I18nProvider>` receives the resolved locale and catalog from the layout Server Component and exposes `useTranslations(namespace?)` to all nested client components.

---

## Architecture

### Route Structure

```
apps/web/app/
  layout.tsx                      <- root layout: reads locale cookie, sets html lang, mounts I18nProvider
  [locale]/
    layout.tsx                    <- safety-net locale validation
    (landing)/
      page.tsx                    <- reads locale from params
      components/
        landing-header.tsx
        hero-section.tsx
        features-section.tsx
        cta-section.tsx
        landing-footer.tsx
        locale-switcher.tsx       <- "use client", uses router.push
    (auth)/
      signin/page.tsx             <- reads locale from params
      welcome/page.tsx
  app/                            <- authenticated shell (was (app) route group)
    layout.tsx                    <- mounts I18nProvider with locale from cookie
    workspaces/page.tsx
    settings/locale/page.tsx      <- "use client", uses useTranslations
  api/
    auth/[...all]/route.ts        <- Better Auth (proxy passes through)
    rpc/[[...route]]/route.ts     <- oRPC (proxy passes through, handler checks session)
```

### Proxy Structure

```
apps/web/
  middleware.ts                   <- dispatcher
  proxy/
    landing.ts                    <- locale validation, redirect, cookie injection
    app.ts                        <- session check, redirect to /{locale}/signin
    shared.ts                     <- detectLocale(), isSafeRedirectPath(), LOCALE_COOKIE_OPTIONS
```

### Data Flow

```
Request arrives
      |
      v
middleware.ts (dispatcher)
      |
      +- /api/auth/*  -> pass through (Better Auth)
      +- /api/rpc/*   -> pass through (oRPC + session check at handler)
      +- /_next/*     -> pass through (static assets)
      |
      +- /            -> landing proxy -> redirect /{preferredLocale}?{query}, set cookie
      +- /{locale}/*  -> landing proxy -> validate locale, set cookie, pass through
      |                                   (redirect if unsupported segment)
      |
      +- /app/*       -> app proxy -> check Better Auth session
                                       +- authenticated   -> set locale cookie if missing, pass through
                                       +- unauthenticated -> redirect /{locale}/signin?redirect=/app/...

Server Component renders
      |
      +- reads locale cookie via headers()
      +- calls getTranslator(locale) from appropriate i18n module
      +- passes translated strings as props to child components
```

---

## Components and Interfaces

### `apps/web/proxy/shared.ts`

```typescript
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/landing/index.ts";
import type { Locale } from "@/lib/i18n/landing/index.ts";

export function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale;

  const acceptLang =
    request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] ?? "";
  if (isValidLocale(acceptLang)) return acceptLang;

  return DEFAULT_LOCALE;
}

export function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes(":");
}

export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  httpOnly: false,
} as const;
```

---

### `apps/web/proxy/landing.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/landing/index.ts";
import { detectLocale, LOCALE_COOKIE_OPTIONS } from "./shared.ts";

export function landingProxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const locale = detectLocale(request);
    const redirectUrl = new URL(`/${locale}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("locale", locale, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";

  if (!isValidLocale(firstSegment)) {
    const rest = segments.slice(1).join("/");
    const redirectUrl = new URL(
      `/${DEFAULT_LOCALE}${rest ? `/${rest}` : ""}`,
      request.url,
    );
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("locale", DEFAULT_LOCALE, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set("locale", firstSegment, LOCALE_COOKIE_OPTIONS);
  return response;
}
```

---

### `apps/web/proxy/app.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/identity/auth.ts";
import { detectLocale, isSafeRedirectPath, LOCALE_COOKIE_OPTIONS } from "./shared.ts";

export async function appProxy(request: NextRequest): Promise<NextResponse> {
  const locale = detectLocale(request);
  const hasLocaleCookie = !!request.cookies.get("locale")?.value;
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const { pathname, search, hash } = request.nextUrl;
    const fullPath = pathname + search + hash;
    const signinUrl = new URL(`/${locale}/signin`, request.url);
    if (isSafeRedirectPath(fullPath)) {
      signinUrl.searchParams.set("redirect", fullPath);
    }
    const response = NextResponse.redirect(signinUrl);
    if (!hasLocaleCookie) {
      response.cookies.set("locale", locale, LOCALE_COOKIE_OPTIONS);
    }
    return response;
  }

  const response = NextResponse.next();
  if (!hasLocaleCookie) {
    response.cookies.set("locale", locale, LOCALE_COOKIE_OPTIONS);
  }
  return response;
}
```

---

### `apps/web/middleware.ts`

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { landingProxy } from "@/proxy/landing.ts";
import { appProxy } from "@/proxy/app.ts";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/app")) {
    return appProxy(request);
  }

  return landingProxy(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

### `apps/web/lib/i18n/landing/index.ts`

Unchanged from current implementation. Exports `translationsLoaders`, `Locale`, `LandingCatalog`, `LandingTranslationKey`, `DEFAULT_LOCALE`, `isValidLocale`, `loadTranslations`, `getTranslator(locale: Locale)`.

No `extractLocale` — locale always comes from the cookie (set by proxy) or URL params.

---

### `apps/web/lib/i18n/app/index.ts`

Simplified from current implementation. `extractLocale` reads only the `locale` cookie — no Accept-Language fallback needed here since the proxy guarantees the cookie is always set before `/app/*` renders.

```typescript
export function extractLocale(headers: Headers): Locale {
  const cookieHeader = headers.get("cookie") ?? "";
  const cookieLocale = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("locale="))
    ?.split("=")[1]
    ?.trim();

  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale as Locale;
  return DEFAULT_LOCALE; // fallback for tests / direct access without proxy
}

export async function getTranslator(headers: Headers) {
  const locale = extractLocale(headers);
  const catalog = await loadTranslations(locale);
  return { t: createTranslator(catalog), locale };
}
```

---

### `apps/web/app/layout.tsx` — Root Layout

Reads the locale cookie and mounts `<I18nProvider>` for the app shell. Sets `<html lang>`.

```typescript
export default async function RootLayout({ children }) {
  const locale = extractLocale(await headers()); // reads locale cookie
  const catalog = await loadTranslations(locale);

  return (
    <html lang={locale}>
      <body ...>
        <I18nProvider locale={locale} catalog={catalog}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

---

### Landing Page Integration

```typescript
// apps/web/app/[locale]/(landing)/page.tsx
export default async function LandingPage({ params }) {
  const { locale } = await params;
  const { t } = await getTranslator(locale); // landing module

  return (
    <>
      <LandingHeader siteName={t("common.siteName")} ... />
      <main>
        <HeroSection headline={t("landing.hero.headline")} ... />
        <FeaturesSection ... />
        <CtaSection ... />
      </main>
      <LandingFooter
        copyright={t("landing.footer.copyright", { year: String(new Date().getFullYear()) })}
        currentLocale={locale}
        localeSwitcherLabel={t("common.language")}
        supportedLocales={Object.keys(translationsLoaders) as Locale[]}
      />
    </>
  );
}
```

---

### Auth Page Integration

```typescript
// apps/web/app/[locale]/(auth)/signin/page.tsx
export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const { redirect } = await searchParams;
  const safeRedirect = redirect && isSafeRedirectPath(redirect) ? redirect : "/app/workspaces";
  const { t } = await getTranslator(locale); // landing module

  return (
    <SignInForm
      redirectTo={safeRedirect}
      strings={{
        title: t("auth.signIn.title"),
        subtitle: t("auth.signIn.subtitle"),
        submitLabel: t("auth.signIn.submit"),
        loadingLabel: t("auth.signIn.loading"),
      }}
    />
  );
}
```

Note: the default redirect after sign-in changes from `/workspaces` to `/app/workspaces` to match the new path prefix.

---

### `LocaleSwitcher` Component

```typescript
// apps/web/app/[locale]/(landing)/components/locale-switcher.tsx
"use client";

export function LocaleSwitcher({ currentLocale, supportedLocales, label }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e) {
    const newLocale = e.target.value;
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
    // The proxy will set locale cookie on the next request to /{newLocale}/*
  }

  return (
    <label>
      {label}
      <select value={currentLocale} onChange={handleChange}>
        {supportedLocales.map((loc) => (
          <option key={loc} value={loc}>{loc.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
```

No cookie write in the component — the proxy handles it on the next request.

---

## Data Models

### `apps/web/lib/i18n/landing/locales/en.json`

```json
{
  "common": {
    "siteName": "MiniSlack",
    "signIn": "Sign in",
    "skipToContent": "Skip to main content",
    "language": "Language"
  },
  "landing": {
    "hero": {
      "eyebrow": "Now in beta",
      "headline": "Team messaging without the noise",
      "subheadline": "A fast, focused messaging app for small teams.",
      "cta": "Get started"
    },
    "features": {
      "sectionLabel": "Features",
      "heading": "Everything your team needs",
      "subheading": "Built for speed and simplicity.",
      "realtime": { "name": "Real-time Messaging", "description": "..." },
      "workspaces": { "name": "Workspaces & Channels", "description": "..." },
      "files": { "name": "File Sharing", "description": "..." }
    },
    "cta": {
      "headline": "Ready to bring your team together?",
      "subheadline": "Get started in seconds.",
      "button": "Get started"
    },
    "footer": { "copyright": "© {{year}} MiniSlack" },
    "meta": {
      "title": "MiniSlack — Team Messaging",
      "description": "A fast, focused messaging app for small teams."
    }
  },
  "auth": {
    "signIn": { "title": "Sign In", "subtitle": "Sign in to your account.", "submit": "Sign in", "loading": "Signing in…" },
    "welcome": { "title": "Welcome to MiniSlack", "subtitle": "Let's get you set up.", "submit": "Continue", "loading": "Setting up…" }
  }
}
```

### `apps/web/lib/i18n/app/locales/en.json`

```json
{
  "common": { "loading": "Loading…", "save": "Save", "cancel": "Cancel", "language": "Language" },
  "settings": {
    "locale": {
      "title": "Language",
      "description": "Choose the language for the MiniSlack interface.",
      "save": "Save preference",
      "saved": "Language updated."
    }
  },
  "workspaces": { "title": "Workspaces", "subtitle": "Select or create a workspace." }
}
```

French (`fr.json`) files mirror the same structure with French translations for both modules.

---

## Correctness Properties

### Property 1: Interpolation replaces all placeholders

For any translation key whose value contains `{{param}}` placeholders and a params object supplying those values, the translator SHALL return a string where every placeholder has been replaced.

**Validates: Requirements 1.5, 11.4**

---

### Property 2: Locale detection always returns a supported locale

For any `NextRequest` (empty, arbitrary Accept-Language, arbitrary cookie), `detectLocale(request)` SHALL return a value that is a key of `translationsLoaders`.

**Validates: Requirements 2.2, 2.5**

---

### Property 3: Cookie locale takes priority over Accept-Language

For any `NextRequest` with a `locale` cookie set to a supported locale, `detectLocale(request)` SHALL return that cookie value regardless of the `Accept-Language` header.

**Validates: Requirements 2.3**

---

### Property 4: HTML lang attribute reflects resolved locale

For any supported locale, when the root layout is rendered with a `locale` cookie set to that locale, the rendered `<html>` element SHALL have a `lang` attribute equal to that locale string.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 5: Locale catalog round-trip integrity

For any supported locale, loading the catalog via `loadTranslations(locale)` and constructing a translator from it SHALL produce a translator that resolves every key defined in the `en` catalog to a non-empty string.

**Validates: Requirements 11.1, 11.2**

---

### Property 6: Translator idempotence

For any valid translation key and any params object, calling the translator twice with the same arguments SHALL return identical strings.

**Validates: Requirements 11.3, 11.4**

---

### Property 7: Landing proxy always sets locale cookie

For any request to a `/{locale}/*` path with a valid locale, the landing proxy response SHALL include a `Set-Cookie` header for the `locale` cookie equal to the path segment value.

**Validates: Requirements 2.1, 2.2**

---

### Property 8: App proxy redirects unauthenticated requests

For any unauthenticated request to `/app/*`, the app proxy SHALL return a redirect response to `/{locale}/signin?redirect=/app/...`.

**Validates: Requirements 10.3**

---

## Error Handling

### Missing locale cookie on app shell render

If a Server Component in the `/app` shell reads `headers()` and finds no `locale` cookie (e.g. in tests or direct access bypassing the proxy), `extractLocale` falls back to `DEFAULT_LOCALE`. This is a safe degradation — the user sees English rather than an error.

### Unsupported locale in URL

The landing proxy redirects `/{unsupportedSegment}/*` to `/{DEFAULT_LOCALE}/*` before the request reaches any Server Component. The `[locale]/layout.tsx` performs a secondary validation as a safety net for any path that bypasses the proxy (e.g. direct Next.js rendering in tests).

### Session check failure in app proxy

If `auth.api.getSession()` throws (e.g. network error to auth service), the error propagates and Next.js returns a 500. This is intentional — a failed session check should not silently grant access.
