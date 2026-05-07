# Implementation Plan: Component Dev Page

## Overview

Build the component showcase at `/dev/components` with sidebar navigation and individual pages for each component. The showcase is only accessible in development mode.

## Tasks

- [ ] 1. Implement the dev layout
  - Create `apps/web/app/(dev)/layout.tsx`
    - Check `process.env.NODE_ENV`
    - Return `notFound()` if not `"development"`
    - Otherwise render `{children}`
  - _Requirements: 1_

- [ ] 2. Implement the components layout with sidebar
  - Create `apps/web/app/(dev)/components/layout.tsx`
    - Two-column layout: sidebar (w-64) + main content (flex-1)
    - Sidebar with navigation links to all component pages
    - List components: Button, Spinner, Input, Label, Card
  - _Requirements: 1_

- [ ] 3. Implement the index page
  - Create `apps/web/app/(dev)/components/page.tsx`
    - Landing page with component list and descriptions
    - Brief explanation of the showcase purpose
  - _Requirements: 1_

- [ ] 4. Implement the Button showcase page
  - Create `apps/web/app/(dev)/components/button/page.tsx`
    - Import Button component
    - Render all appearance variants (default, primary, success, danger, warning, outline, subtle, transparent, link)
    - Render all size variants (sm, default, lg)
    - Render shape variants (square, circle)
    - Render loading state examples
    - Render disabled state examples
    - Render asChild example
    - Organize in sections with descriptive headings
  - _Requirements: 2_

- [ ] 5. Implement the Spinner showcase page
  - Create `apps/web/app/(dev)/components/spinner/page.tsx`
    - Import Spinner component
    - Render all size variants (3xs, 2xs, xs, sm, md, lg, xl, 2xl)
    - Render all appearance variants (primary, inverted)
    - Include size reference table
    - Organize in sections with descriptive headings
  - _Requirements: 3_

- [ ] 6. Implement placeholder pages for unimplemented components
  - Create `apps/web/app/(dev)/components/input/page.tsx`
    - Show placeholder message with spec reference
    - Include commented-out examples for when Input is implemented
  - Create `apps/web/app/(dev)/components/label/page.tsx`
    - Show placeholder message with spec reference
    - Include commented-out examples for when Label is implemented
  - Create `apps/web/app/(dev)/components/card/page.tsx`
    - Show placeholder message with spec reference
    - Include commented-out examples for when Card is implemented
  - _Requirements: 4, 5, 6_

- [ ] 7. Verify the showcase renders correctly
  - Start the dev server: `npm run dev -w @mini-slack/web`
  - Navigate to `/dev/components` and verify the index page renders
  - Click through each component link in the sidebar
  - Verify Button and Spinner pages show all variants
  - Verify Input, Label, and Card pages show placeholder messages
  - Verify the showcase returns 404 in production mode
