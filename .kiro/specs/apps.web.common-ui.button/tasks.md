# Implementation Plan: Button Component

## Overview

Build the `Button` UI component with Radix Slot, tailwind-variants, and Fluent Design System tokens. The component lives in `apps/web/components/ui/button.tsx` with co-located unit and property-based tests.

## Tasks

- [x] 1. Install dependencies
  - Install `@radix-ui/react-slot` and `tailwind-variants` as production dependencies in `apps/web`
  - Install `@testing-library/react`, `@testing-library/user-event`, and `jsdom` as dev dependencies in `apps/web`
  - Update `apps/web/vitest.config.ts` to support `jsdom` environment for component test files via `environmentMatchGlobs`
  - _Requirements: 4, 8_

- [x] 2. Implement the Button component
  - Create `apps/web/components/ui/button.tsx`
    - Export `ButtonProps` interface extending `React.ButtonHTMLAttributes<HTMLButtonElement>` and `VariantProps<typeof buttonVariants>`
    - Implement `buttonVariants` using `tv()` from `tailwind-variants` with all appearance, size, and shape variants
    - Use `@radix-ui/react-slot` `Slot` primitive for `asChild` support
    - Implement loading state with Spinner component and size/appearance mapping
    - Apply `fluent-focus-ring` utility class for keyboard focus
    - Handle disabled state with opacity and cursor styles
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8_

- [x] 3. Implement unit tests
  - Create `apps/web/components/ui/button.test.tsx` (co-located)
    - Test each appearance variant renders correct classes
    - Test `asChild` behavior (renders as child element)
    - Test focus ring class is present
    - Test size heights (sm=24px, default=32px, lg=40px)
    - Test `isLoading` sets disabled attribute and renders Spinner
    - Test `disabled` sets disabled attribute and opacity styles
    - Test shape variants override padding
  - _Requirements: 1, 2, 3, 4, 5, 6, 7_

- [x] 4. Implement property-based tests
  - Create `apps/web/components/ui/button.property.test.tsx` (co-located)
    - Property 1: Button loading state implies disabled and Spinner (`numRuns: 100`)
    - Property 2: Disabled Button always sets the disabled attribute (`numRuns: 100`)
  - _Correctness Properties: 1, 2_

- [x] 5. Verify all tests pass
  - Run `npm run test -w @mini-slack/web` and confirm all Button tests pass
