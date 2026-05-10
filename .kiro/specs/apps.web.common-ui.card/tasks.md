# Implementation Plan: Card Component

## Overview

Build the `Card` UI component with Fluent Design System tokens. The component lives in `apps/web/components/ui/card.tsx` with co-located unit tests.

## Tasks

- [ ] 1. Implement the Card component
  - Create `apps/web/components/ui/card.tsx`
    - Export `CardProps` interface extending `React.HTMLAttributes<HTMLDivElement>`
    - Use `React.forwardRef` to forward ref to the underlying `<div>` element
    - Apply styles: `bg-gray-2 border border-gray-a6 rounded-xl p-8`
    - Use `cn()` utility to merge class names
  - _Requirements: 1, 2_

- [ ] 2. Implement unit tests
  - Create `apps/web/components/ui/card.test.tsx` (co-located)
    - Test base class names are present (background, border, border radius, padding)
    - Test custom `className` is merged with base styles
    - Test children are rendered correctly
  - _Requirements: 1_

- [ ] 3. Verify all tests pass
  - Run `npm run test -w @mini-slack/web` and confirm all Card tests pass
