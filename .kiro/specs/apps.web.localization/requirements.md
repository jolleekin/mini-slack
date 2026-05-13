# Requirements Document

## Introduction

This feature extends MiniSlack's `apps/web` application with full UI localization support. Currently, the app has a narrow error-message translation system (`apps/web/lib/errors/`) that uses the `@mini-slack/i18n` package to translate server-side error codes. This feature generalises that pattern to cover all user-facing UI strings — landing page copy, auth page labels, form validation messages, navigation text, and app-shell strings — so that the interface can be rendered in multiple languages.

The implementation integrates with Next.js 16 App Router conventions (Server Components, `generateStaticParams`, `<html lang>` attribute), reuses the existing `@mini-slack/i18n` `createTranslator` utility, and remains consistent with the existing error-locale file structure under `apps/web/lib/errors/locales/`.

The landing and auth pages use **path-based locale routing** (`/en`, `/fr`, `/en/signin`) so that each language version has a distinct, indexable URL. The app shell (authenticated routes under `/app`) uses cookie-based locale since those pages are not indexed by search engines.

The proxy (Next.js 16 `middleware.ts`) is the **single locale resolution point**: it detects the locale on every request, sets a `locale` cookie, and performs any necessary redirects. All downstream code (Server Components, API handlers) reads the cookie — no per-route locale detection logic.

**Scope:** `apps/web` only. The `@mini-slack/i18n` package itself is not modified.

## Glossary

- **Locale**: A BCP 47 language tag (e.g. `en`, `fr`) identifying a supported language.
- **Default_Locale**: The locale used when no supported locale can be detected; currently `en`.
- **Locale_Catalog**: A JSON file containing all UI translation strings for one locale.
- **Translator**: A typed function returned by `createTranslator()` from `@mini-slack/i18n` that resolves a dot-separated key to a translated string, optionally interpolating named parameters.
- **Translation_Key**: A dot-separated string path into a Locale_Catalog (e.g. `landing.hero.headline`).
- **Landing_I18n_Module**: The module at `apps/web/lib/i18n/landing/index.ts` — owns catalog loading for `(landing)` and `(auth)` route groups.
- **App_I18n_Module**: The module at `apps/web/lib/i18n/app/index.ts` — owns catalog loading for the `/app` shell.
- **Locale_Cookie**: An HTTP cookie named `locale` set by the proxy on every request, containing the resolved Locale value. All downstream code reads this cookie as the authoritative locale source.
- **Landing_Proxy**: The proxy handler for `/{locale}/*` and bare `/` paths — validates the locale segment, redirects if needed, and sets the Locale_Cookie.
- **App_Proxy**: The proxy handler for `/app/*` paths — checks the Better Auth session, reads the Locale_Cookie for redirect URLs, and redirects unauthenticated users to `/{locale}/signin`.
- **Route_Group**: A Next.js App Router folder wrapped in parentheses (e.g. `(landing)`, `(auth)`) that shares a layout without affecting the URL.
- **Locale_Segment**: The `[locale]` dynamic path segment prepended to landing and auth routes, producing URLs such as `/en`, `/fr`, `/en/signin`, `/fr/signin`.
- **Server_Component**: A React component that runs exclusively on the server and can perform async operations such as loading a Locale_Catalog.
- **Client_Component**: A React component marked `"use client"` that runs in the browser and receives translated strings as props.
- **Error_I18n_Module**: The existing module at `apps/web/lib/errors/i18n.ts` — separate from the UI i18n modules and not replaced by this feature.

---

## Requirements

### Requirement 1: Locale Catalog Structure

**User Story:** As a developer, I want all UI strings stored in structured JSON locale files, so that translators can update copy without touching source code.

#### Acceptance Criteria

1. THE Landing_I18n_Module SHALL provide a Locale_Catalog for the `en` locale containing translation keys for every user-facing string in the `(landing)` and `(auth)` route groups.
2. THE App_I18n_Module SHALL provide a Locale_Catalog for the `en` locale containing translation keys for every user-facing string in the `/app` shell.
3. EACH Locale_Catalog SHALL organise keys by feature area using a top-level namespace (e.g. `landing.*`, `auth.*`, `common.*`, `settings.*`, `workspaces.*`).
4. WHEN a new locale is added, EACH I18n_Module SHALL require only the addition of a new JSON file and a new entry in the locale loader map — no changes to component code SHALL be required.
5. EACH Locale_Catalog SHALL support named interpolation parameters using the `{{param}}` syntax already implemented in `createTranslator()`.
6. EACH I18n_Module SHALL export a `Locale` union type derived from the keys of its locale loader map, so that TypeScript enforces valid locale values at compile time.

---

### Requirement 2: Locale Detection and Cookie Injection

**User Story:** As a visitor, I want the app to automatically serve content in my preferred language, so that I can read the interface without manually selecting a locale.

#### Acceptance Criteria

1. THE proxy SHALL be the single locale resolution point — it SHALL detect the locale on every request and set a `locale` cookie before the request reaches any Server Component or API handler.
2. FOR `/{locale}/*` paths, THE Landing_Proxy SHALL read the locale from the URL path segment and set the Locale_Cookie to that value.
3. WHEN a request arrives at bare `/`, THE Landing_Proxy SHALL detect the preferred locale (cookie → `Accept-Language` → Default_Locale) and redirect to `/{preferredLocale}`, preserving query parameters.
4. WHEN a `/{unsupportedSegment}/*` path is requested, THE Landing_Proxy SHALL redirect to `/{Default_Locale}/{rest}`.
5. FOR `/app/*` paths, THE App_Proxy SHALL read the Locale_Cookie (set by a prior landing/auth visit or the user's preference) falling back to `Accept-Language` then Default_Locale, and set the cookie if not already present.
6. ALL Server Components and API handlers SHALL read the locale exclusively from the Locale_Cookie — they SHALL NOT perform independent locale detection from `Accept-Language` or URL segments.

---

### Requirement 3: Server Component Integration

**User Story:** As a developer, I want Server Components to load translated strings at render time, so that localized content is included in the initial HTML without a client-side fetch.

#### Acceptance Criteria

1. WHEN a Server_Component needs translated strings, it SHALL read the `locale` cookie from `headers()` and call `getTranslator(locale)` from the appropriate I18n_Module.
2. THE `getTranslator(locale: Locale)` function SHALL be callable from any Server_Component without requiring a React context provider.
3. THE `(landing)` route group's page and section components SHALL receive translated strings via props from their parent Server_Component, replacing all hardcoded English strings.
4. THE `(auth)` route group's page components SHALL receive translated strings via props from their parent Server_Component, replacing all hardcoded English strings.
5. WHEN translated strings are passed to a Client_Component, THE Client_Component SHALL accept them as typed props — it SHALL NOT call `getTranslator()` directly.

---

### Requirement 4: HTML Language Attribute

**User Story:** As a user relying on a screen reader or browser translation tool, I want the page's `<html lang>` attribute to reflect the active locale, so that assistive technologies apply the correct language rules.

#### Acceptance Criteria

1. THE Root_Layout at `apps/web/app/layout.tsx` SHALL set the `lang` attribute on the `<html>` element to the resolved Locale for each request.
2. WHEN the resolved Locale is `en`, THE Root_Layout SHALL render `<html lang="en">`.
3. WHEN a new Locale is added and detected, THE Root_Layout SHALL render `<html lang="{locale}">` using the resolved value.

---

### Requirement 5: Type Safety

**User Story:** As a developer, I want Translation_Keys to be type-checked at compile time, so that missing or misspelled keys are caught before runtime.

#### Acceptance Criteria

1. THE Translator returned by `getTranslator()` SHALL accept only valid Translation_Keys derived from the `en` Locale_Catalog's structure, enforced via the `TranslationKey<T>` type from `@mini-slack/i18n`.
2. WHEN a developer references a Translation_Key that does not exist in the Locale_Catalog, THE TypeScript compiler SHALL report a type error.
3. WHEN a Translation_Key requires interpolation parameters, THE Translator SHALL accept a `params` argument typed as `TranslationParams`.
4. THE Locale_Catalog type SHALL be inferred from the `en` JSON file so that adding or removing keys automatically updates the valid Translation_Key set without manual type maintenance.

---

### Requirement 6: Landing Page Localization

**User Story:** As a visitor, I want the landing page to display in my preferred language, so that I can understand the product's value proposition without language barriers.

#### Acceptance Criteria

1. THE `(landing)` page Server_Component SHALL call `getTranslator(locale)` and pass translated strings to `LandingHeader`, `HeroSection`, `FeaturesSection`, `CtaSection`, and `LandingFooter`.
2. EVERY user-facing string in the landing page components SHALL be sourced from the Locale_Catalog — no hardcoded English strings SHALL remain in JSX.
3. THE `en` Locale_Catalog SHALL include keys for: the site name, navigation links, hero headline, hero subheadline, hero CTA label, feature names and descriptions, CTA section headline and button label, and footer copyright text.

---

### Requirement 7: Auth Page Localization

**User Story:** As a user on the sign-in or welcome page, I want all labels, placeholders, and messages to appear in my preferred language, so that I can complete authentication without confusion.

#### Acceptance Criteria

1. THE `(auth)` page Server_Components SHALL call `getTranslator(locale)` and pass translated strings to `SignInForm` and `WelcomePage` as props.
2. EVERY user-facing string in the auth pages SHALL be sourced from the Locale_Catalog — no hardcoded English strings SHALL remain in JSX.
3. THE `en` Locale_Catalog SHALL include keys for: page titles, form field labels, button labels, and loading state labels.

---

### Requirement 8: App Shell Localization

**User Story:** As an authenticated user, I want the app shell to display in my preferred language, so that I can use the messaging interface in my language.

#### Acceptance Criteria

1. THE `/app` shell layout SHALL mount `<I18nProvider locale={locale} catalog={catalog}>` so that all nested client components can access translations via `useTranslations()`.
2. THE `locale` used by the app shell SHALL be read from the Locale_Cookie set by the proxy.
3. THE app shell SHALL include a locale settings page at `/app/settings/locale` where authenticated users can change their locale preference by updating the Locale_Cookie.

---

### Requirement 9: Path-Based Routing for Landing and Auth Pages

**User Story:** As a search engine crawler, I want each language version of the landing and auth pages to have a distinct URL, so that localized content can be independently indexed and ranked.

#### Acceptance Criteria

1. THE `(landing)` and `(auth)` route groups SHALL be nested under a `[locale]` dynamic segment, producing URLs of the form `/en`, `/fr`, `/en/signin`, `/fr/signin`.
2. EACH locale-specific page SHALL export `generateStaticParams` returning one entry per supported locale, enabling static generation at build time.
3. THE root path `/` SHALL redirect to `/{preferredLocale}` via the proxy, preserving any query parameters.
4. WHEN a URL contains an unsupported locale segment (e.g. `/de`), THE proxy SHALL redirect to `/{Default_Locale}/{rest}`.
5. EACH locale-specific landing page SHALL export `generateMetadata` that returns a localized `title` and `description` sourced from the Locale_Catalog.
6. THE `<head>` of each landing page SHALL include `<link rel="alternate" hreflang="{locale}" href="/{locale}">` tags for every supported locale, plus `<link rel="alternate" hreflang="x-default" href="/en">`.
7. THE `LocaleSwitcher` component SHALL navigate to the equivalent path in the selected locale (e.g. from `/en` to `/fr`) using `router.push`.

---

### Requirement 10: Proxy Architecture

**User Story:** As a developer, I want the proxy logic split by route domain, so that each handler has a single responsibility and can be reasoned about independently.

#### Acceptance Criteria

1. THE proxy SHALL be split into three focused handlers: `Landing_Proxy` for `/{locale}/*` and `/`, `App_Proxy` for `/app/*`, and pass-through for `/api/*` and `/_next/*`.
2. THE `Landing_Proxy` SHALL handle locale validation, redirect, and Locale_Cookie injection for landing and auth routes.
3. THE `App_Proxy` SHALL handle Better Auth session verification and redirect unauthenticated users to `/{locale}/signin?redirect=/app/...`.
4. THE `App_Proxy` SHALL NOT perform JWT verification — session verification is sufficient for UI routes.
5. THE `/api/auth/*` routes SHALL pass through to Better Auth without proxy intervention.
6. THE `/api/rpc/*` routes SHALL pass through to the oRPC handler, which enforces its own session check.

---

### Requirement 11: Locale Catalog Round-Trip Integrity

**User Story:** As a developer, I want to verify that locale files can be loaded and all keys resolved without data loss, so that a broken or incomplete translation file is caught before deployment.

#### Acceptance Criteria

1. EACH I18n_Module SHALL export a `loadTranslations(locale: Locale)` function that returns the raw Locale_Catalog object for a given locale.
2. FOR ALL supported locales, calling `loadTranslations(locale)` and then constructing a Translator from the result SHALL produce a Translator that resolves every Translation_Key defined in the `en` Locale_Catalog to a non-empty string.
3. FOR ALL valid Translation_Keys in the `en` Locale_Catalog, the Translator SHALL return the same value when called twice with the same key and params (idempotence).
4. FOR ALL Translation_Keys containing `{{param}}` placeholders, calling the Translator with a `params` object SHALL replace every placeholder — calling it again with the same params SHALL produce the same result (idempotence).
