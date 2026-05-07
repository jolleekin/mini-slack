# Implementation Plan: Landing Page

## Overview

Build the MiniSlack landing page as a set of React Server Components composed in `app/(landing)/page.tsx`. The work proceeds in four stages: (1) install the color dependency and wire up the CSS token system, (2) implement each section component, (3) compose the page and export metadata, (4) write tests.

## Tasks

- [x] 1. Install `@radix-ui/colors` and update the CSS token system
  - Run `npm install @radix-ui/colors -w @mini-slack/web` to add the package
  - In `apps/web/app/globals.css`, add `@import` statements for `violet.css`, `violet-dark.css`, `gray.css`, `gray-dark.css`, and `white-a.css` from `@radix-ui/colors` (after the existing `@import "tailwindcss"` line)
  - Extend the existing `@theme inline` block with all violet (1–12), gray (1–12), and white-a (1, 6, 12) color tokens mapped from the corresponding Radix CSS custom properties (e.g. `--color-violet-9: var(--violet-9)`)
  - Verify the dark-mode scales are imported so `@media (prefers-color-scheme: dark)` switching works automatically
  - _Requirements: 7.4 (WCAG AA contrast via Radix color scales)_

- [x] 2. Implement `LandingHeader`
  - Create `apps/web/app/(landing)/components/landing-header.tsx`
  - Render a `<header>` with `sticky top-0 z-50` and a `bg-gray-2/80 backdrop-blur-sm` background
  - Include a visually-hidden "Skip to main content" `<a href="#main-content">` as the first focusable element (visible on focus via `sr-only focus-visible:not-sr-only`)
  - Render a `<nav aria-label="Main navigation">` containing the "MiniSlack" logo wordmark (`text-violet-11`) and a `<Link href="/signin">` with text "Sign in"
  - Apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-8 focus-visible:ring-offset-2` to the Sign in link
  - Content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.3_

  - [ ]* 2.1 Write unit tests for `LandingHeader`
    - File: `apps/web/tests/landing/landing-header.test.tsx`
    - Assert a `<header>` element is rendered
    - Assert a `<nav>` element is present
    - Assert a link with `href="/signin"` and text "Sign in" is present
    - Assert the header's class list includes `sticky`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement `HeroSection`
  - Create `apps/web/app/(landing)/components/hero-section.tsx`
  - Render a `<section aria-labelledby="hero-heading">` with `min-h-[calc(100vh-64px)]` on desktop
  - Include a primary `<h1 id="hero-heading">` with classes `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-12`
  - Include a `<p>` subheadline with `text-lg sm:text-xl text-gray-11 max-w-2xl`
  - Include a `<Link href="/signin">` styled as a primary button: `bg-violet-9 hover:bg-violet-10 text-white text-sm font-semibold` with focus ring classes
  - Mobile layout: `flex flex-col items-center text-center`; desktop layout: `lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center`
  - Include the screenshot placeholder `<div aria-hidden="true">` with mock sidebar and message skeleton rows as specified in the design
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3_

  - [ ]* 3.1 Write unit tests for `HeroSection`
    - File: `apps/web/tests/landing/hero-section.test.tsx`
    - Assert an `<h1>` element is rendered
    - Assert a link with `href="/signin"` is present
    - Assert the screenshot placeholder `<div>` is present and has `aria-hidden="true"`
    - _Requirements: 2.1, 2.2_

- [x] 4. Implement `FeaturesSection`
  - Create `apps/web/app/(landing)/components/features-section.tsx`
  - Define the static `features` array inline with three items: "Real-time Messaging", "Workspaces & Channels", "File Sharing" — each with an inline SVG icon (`aria-hidden="true"`), name, and description
  - Render a `<section aria-labelledby="features-heading">` containing an `<h2 id="features-heading">` and a `<ul>` grid
  - Grid classes: `grid grid-cols-1 md:grid-cols-3 gap-8`
  - Each `<li>` renders a feature card with `bg-gray-2 border border-gray-6 rounded-xl p-6 h-full`
  - Feature name: `text-lg font-semibold text-gray-12`; description: `text-sm text-gray-11 leading-relaxed`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2_

  - [ ]* 4.1 Write unit tests for `FeaturesSection`
    - File: `apps/web/tests/landing/features-section.test.tsx`
    - Assert a `<ul>` (or list container) is rendered
    - Assert exactly 3 feature `<li>` items are rendered
    - Assert each item contains an icon wrapper, a name, and a description
    - Assert the grid container has `md:grid-cols-3` in its class list
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement `CtaSection`
  - Create `apps/web/app/(landing)/components/cta-section.tsx`
  - Render a `<section aria-labelledby="cta-heading">` with `bg-violet-9 py-16 sm:py-24` and centered text
  - Include an `<h2 id="cta-heading">` with `text-2xl sm:text-3xl font-bold text-white`
  - Include a `<Link href="/signin">` styled as a secondary button on violet: `bg-white/10 hover:bg-white/20 text-white text-sm font-semibold` with focus ring classes
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.3_

  - [ ]* 5.1 Write unit tests for `CtaSection`
    - File: `apps/web/tests/landing/cta-section.test.tsx`
    - Assert an `<h2>` element is rendered
    - Assert a link with `href="/signin"` is present
    - Assert the section element has `bg-violet-9` in its class list
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Implement `LandingFooter`
  - Create `apps/web/app/(landing)/components/landing-footer.tsx`
  - Render a `<footer>` with `border-t border-gray-6 py-8`
  - Content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
  - Render copyright text: `© {new Date().getFullYear()} MiniSlack` with `text-sm text-gray-11`
  - _Requirements: 5.1, 5.2, 7.1_

  - [ ]* 6.1 Write unit tests for `LandingFooter`
    - File: `apps/web/tests/landing/landing-footer.test.tsx`
    - Assert a `<footer>` element is rendered
    - Assert the rendered text contains the current year (`new Date().getFullYear().toString()`)
    - Assert the rendered text contains "MiniSlack"
    - Assert the footer element has `border-t` in its class list
    - _Requirements: 5.1, 5.2_

- [x] 7. Compose `page.tsx` and export metadata
  - Update `apps/web/app/(landing)/page.tsx` to import and render all five components in order: `LandingHeader`, then `<main id="main-content">` wrapping `HeroSection`, `FeaturesSection`, `CtaSection`, then `LandingFooter`
  - Export a `metadata` object typed as `Metadata` (from `next`) with `title: "MiniSlack — Team Messaging"` and a non-empty `description` summarising the product
  - Ensure the page remains a React Server Component (no `"use client"` directive)
  - _Requirements: 6.1, 7.1_

  - [ ]* 7.1 Write unit tests for page metadata
    - File: `apps/web/tests/landing/page.test.tsx`
    - Assert `metadata.title === "MiniSlack — Team Messaging"`
    - Assert `metadata.description` is a non-empty string
    - _Requirements: 6.1_

- [x] 8. Checkpoint — Ensure all tests pass
  - Run `npm run test -w @mini-slack/web` from the repo root and confirm all tests in `tests/landing/` pass
  - Ensure no TypeScript errors (`npm run build -w @mini-slack/web`)
  - Ask the user if any questions arise before proceeding

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- No `"use client"` directive should appear in any landing component — all are React Server Components
- The design document has no Correctness Properties section; property-based tests are not applicable for this feature
- All color utilities (`bg-violet-9`, `text-gray-12`, etc.) become available only after Task 1 updates `globals.css`
- The screenshot placeholder is `aria-hidden="true"` and conveys no information to screen readers
