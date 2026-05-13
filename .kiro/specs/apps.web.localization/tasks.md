# Implementation Plan: apps.web.localization

## Overview

Implement full UI localization for `apps/web` using two separate i18n modules — one for the landing/auth route groups and one for the app shell. The proxy is the single locale resolution point: it detects the locale, sets a `locale` cookie, and performs redirects. All downstream code reads the cookie.

## Tasks

- [x] 1. Create the landing i18n module
  - Create `apps/web/lib/i18n/landing/locales/en.json` with all keys for `common.*`, `landing.*`, and `auth.*` namespaces
  - Create `apps/web/lib/i18n/landing/index.ts` exporting `translationsLoaders`, `Locale`, `LandingCatalog`, `LandingTranslationKey`, `DEFAULT_LOCALE`, `isValidLocale`, `loadTranslations`, and `getTranslator(locale: Locale)`
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 11.1, 11.2_

  - [x] 1.1 Write unit tests for the landing i18n module
  - [x] 1.2 Write property test — Property 2: Locale detection always returns a supported locale (app module)
  - [x] 1.3 Write property test — Property 3: Cookie locale takes priority over Accept-Language (app module)
  - [x] 1.4 Write property test — Property 1: Interpolation replaces all placeholders
  - [x] 1.5 Write property test — Property 5: Locale catalog round-trip integrity
  - [x] 1.6 Write property test — Property 6: Translator idempotence

- [x] 2. Create the app i18n module
  - Create `apps/web/lib/i18n/app/locales/en.json` with all keys for `common.*`, `settings.*`, and `workspaces.*` namespaces
  - Create `apps/web/lib/i18n/app/index.ts` exporting `translationsLoaders`, `Locale`, `AppCatalog`, `AppTranslationKey`, `extractLocale`, `loadTranslations`, and `getTranslator`
  - `extractLocale` reads only the `locale` cookie — the proxy guarantees it is always set before `/app/*` renders
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.6, 5.1, 5.2, 5.3, 5.4, 11.1, 11.2_

  - [x] 2.1 Write unit tests for the app i18n module
  - [x] 2.2 Write property test — Property 2: Locale detection always returns a supported locale
  - [x] 2.3 Write property test — Property 3: Cookie locale takes priority over Accept-Language
  - [x] 2.4 Write property test — Property 1: Interpolation replaces all placeholders
  - [x] 2.5 Write property test — Property 5: Locale catalog round-trip integrity
  - [x] 2.6 Write property test — Property 6: Translator idempotence

- [x] 3. Create the app i18n client context
  - Create `apps/web/lib/i18n/app/context.tsx` with `"use client"` directive
  - Implement `I18nProvider` and `useTranslations(namespace?)` hook
  - _Requirements: 8.1_

  - [x] 3.1 Write unit tests for `I18nProvider` and `useTranslations`

- [x] 4. Checkpoint — Ensure all i18n module tests pass

- [x] 5. Update the root layout to resolve locale and mount `<I18nProvider>`
  - Read locale from cookie via `extractLocale(await headers())` from the app module
  - Set `<html lang={locale}>` and wrap children in `<I18nProvider locale={locale} catalog={catalog}>`
  - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.2_

  - [x] 5.1 Write property test — Property 4: HTML lang attribute reflects resolved locale

- [x] 6. Update landing page section components to accept string props
  - _Requirements: 3.3, 3.5, 6.1, 6.2_

- [x] 7. Create the `LocaleSwitcher` client component
  - Uses `router.push` to navigate to the equivalent path in the selected locale
  - No cookie write — the proxy sets the cookie on the next request
  - _Requirements: 9.7_

  - [x] 7.1 Write unit tests for `LocaleSwitcher`

- [x] 8. Update the landing page to call `getTranslator` and pass string props
  - _Requirements: 3.1, 3.3, 6.1, 6.2, 6.3_

- [x] 9. Update auth pages to call `getTranslator` and pass string props
  - _Requirements: 3.1, 3.4, 3.5, 7.1, 7.2, 7.3_

- [x] 10. Checkpoint — Ensure all landing and auth tests pass

- [x] 11. Create the locale settings page in the app shell
  - _Requirements: 8.3_

- [x] 12. Final checkpoint — Ensure all tests pass

- [x] 13. Add French (`fr`) locale catalogs
  - _Requirements: 1.3, 11.1, 11.2_

- [x] 14. Migrate landing i18n module to locale-param API
  - _Requirements: 2.1, 9.1_

- [x] 15. Add `[locale]` dynamic segment to landing and auth route groups
  - _Requirements: 9.1, 9.2_

- [x] 16. Add `generateMetadata` to the landing page
  - _Requirements: 9.5, 9.6_

- [x] 17. Refactor proxy into focused handlers
  - Delete `apps/web/proxy.ts` (JWT-based proxy — no longer used for UI routes)
  - Create `apps/web/proxy/shared.ts` exporting `detectLocale(request: NextRequest): Locale`, `isSafeRedirectPath(path: string): boolean`, and `LOCALE_COOKIE_OPTIONS`
  - Create `apps/web/proxy/landing.ts` exporting `landingProxy(request: NextRequest): NextResponse`
    - Redirect bare `/` to `/{preferredLocale}` (via `detectLocale`), preserving query params, set locale cookie
    - Redirect `/{unsupportedSegment}/*` to `/{DEFAULT_LOCALE}/{rest}`, set locale cookie
    - For valid `/{locale}/*`: set locale cookie to the path segment value, pass through
  - Create `apps/web/proxy/app.ts` exporting `appProxy(request: NextRequest): Promise<NextResponse>`
    - Call `auth.api.getSession({ headers: request.headers })` to check the Better Auth session
    - If no session: redirect to `/{locale}/signin?redirect={fullPath}`, set locale cookie if missing
    - If authenticated: set locale cookie if missing, pass through
  - Update `apps/web/middleware.ts` to dispatch: `/_next/*` and `/api/*` pass through; `/app/*` goes to `appProxy`; everything else goes to `landingProxy`
  - Delete `apps/web/middleware.test.ts` (tests the old JWT-based proxy logic)
  - Write unit tests for `proxy/shared.ts` at `apps/web/proxy/shared.test.ts`
  - Write unit tests for `proxy/landing.ts` at `apps/web/proxy/landing.test.ts`
  - Write unit tests for `proxy/app.ts` at `apps/web/proxy/app.test.ts`
  - Write property tests for `detectLocale` — Property 2 and Property 3 — at `apps/web/proxy/shared.property.test.ts`
  - Write property test for landing proxy — Property 7: landing proxy always sets locale cookie — at `apps/web/proxy/landing.property.test.ts`
  - Write property test for app proxy — Property 8: app proxy redirects unauthenticated requests — at `apps/web/proxy/app.property.test.ts`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 18. Move app shell routes to `/app` path prefix
  - Rename `apps/web/app/(app)/` to `apps/web/app/app/` (removes the route group, adds `/app` to all URLs)
  - Update all internal links and redirects that reference `/workspaces` or `/settings` to use `/app/workspaces` and `/app/settings`
  - Update `apps/web/proxy/app.ts` matcher to use `pathname.startsWith("/app")`
  - Update the sign-in redirect default from `/workspaces` to `/app/workspaces` in auth pages
  - Update `apps/web/app/app/layout.tsx` to read locale from cookie and mount `<I18nProvider>`
  - _Requirements: 8.1, 8.2, 10.2, 10.3_

- [x] 19. Remove locale redirect logic from App Router layer
  - Delete `apps/web/app/page.tsx` (root redirect now handled entirely by landing proxy)
  - Delete `apps/web/app/page.test.tsx`
  - Simplify `apps/web/app/[locale]/layout.tsx` — remove the `isValidLocale` redirect (proxy handles it); keep only `generateStaticParams` and the passthrough render
  - Delete `apps/web/app/[locale]/layout.test.tsx`
  - _Requirements: 2.1, 2.3, 2.4, 9.3, 9.4_

- [x] 20. Update `LocaleSwitcher` tests to reflect proxy-managed cookie
  - Update unit tests in `apps/web/app/[locale]/(landing)/components/locale-switcher.test.tsx` to assert `router.push` is called with the correct path — no cookie write assertions
  - _Requirements: 9.7_

- [x] 21. Final checkpoint — Ensure all tests pass after proxy refactor
  - Run full test suite; fix any failures
  - _Requirements: all_

## Notes

- The proxy is the single locale resolution point — all routes read the `locale` cookie
- `proxy/landing.ts` sets the cookie from the URL segment; `proxy/app.ts` sets it from cookie/Accept-Language if missing
- The `[locale]/layout.tsx` retains a safety-net locale validation for direct access in tests
- JWT logic from the old `proxy.ts` is removed — reintroduce only when extracting the API or adding native apps
- The `/app` path prefix makes the future `app.minislack.com` subdomain split a pure infrastructure change
