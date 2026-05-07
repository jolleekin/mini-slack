# Implementation Plan: Spinner Component

## Overview

Build the `Spinner` UI component with CSS masking, conic gradients, and Fluent Design System tokens. The component lives in `apps/web/components/ui/spinner.tsx` with co-located unit tests.

## Tasks

- [x] 1. Implement the Spinner component
  - Create `apps/web/components/ui/spinner.tsx`
    - Export `SpinnerProps` interface extending `VariantProps<typeof spinnerVariants>`
    - Implement `spinnerVariants` using `tv()` with `slots` pattern for multi-element styling
    - Implement two-layer structure: static track ring + animated tail ring
    - Add `role="status"` and visually-hidden "Loading..." text
    - Add `data-spinner` attribute for testing
    - Define all size variants (3xs through 2xl) with stroke width tokens
    - Define appearance variants (primary, inverted)
  - Add CSS animation keyframes to `apps/web/app/globals.css`
    - Define `@keyframes spinner-tail` for rotation
    - Style `.spinner-tail::before` and `.spinner-tail::after` with conic-gradient masking
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 2. Implement unit tests
  - Create `apps/web/components/ui/spinner.test.tsx` (co-located)
    - Test `role="status"` is present
    - Test visually-hidden "Loading..." text is present
    - Test `data-spinner` attribute is present
    - Test each size variant renders correct dimensions
    - Test each appearance variant renders correct colors
  - _Requirements: 1, 2, 3_

- [x] 3. Verify all tests pass
  - Run `npm run test -w @mini-slack/web` and confirm all Spinner tests pass
