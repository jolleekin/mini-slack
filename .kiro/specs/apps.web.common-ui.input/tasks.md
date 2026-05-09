# Implementation Plan: Input Component

## Overview

Build the `Input` UI component with Fluent Design System tokens, error state support, Radix Form integration, and React 19's native ref pattern. The component lives in `apps/web/components/ui/input.tsx` with co-located unit tests.

## Tasks

- [x] 1. Implement the Input component
  - Create `apps/web/components/ui/input.tsx`
    - Export `InputProps` interface extending `React.InputHTMLAttributes<HTMLInputElement>` with `hasError?: boolean` and `ref?: React.Ref<HTMLInputElement>`
    - Use React 19's native `ref` prop pattern (NO `React.forwardRef`)
    - Accept `ref` as a regular prop and forward it to the underlying `<input>` element
    - Wrap input in a `<div className="relative">` container to support animated focus indicator
    - Add `data-error={hasError}` attribute to input for CSS targeting
    - Apply base styles: `bg-gray-a2`, `text-gray-12`, `placeholder:text-gray-a11`, `rounded-md`, `px-3 py-2`
    - Normal state: `border-gray-a7`, focus: `border-accent-8` + `fluent-focus-ring`
    - Error state (manual): `border-danger-7`, focus: `border-danger-8` + `fluent-focus-ring-danger`
    - Error state (Radix Form): `data-[invalid]:border-danger-7`, `data-[invalid]:focus:border-danger-8`
    - Add `input-with-focus-indicator` class for animated focus indicator styling
    - Use `cn()` utility to merge class names
  - Add `input-with-focus-indicator` utility class to `apps/web/app/globals.css`
    - Use `::after` pseudo-element for the animated line
    - Position absolutely at bottom with `height: 2px`
    - Initial state: `transform: scaleX(0)` with `transform-origin: center`
    - Focused state: `transform: scaleX(1)`
    - Transition: `transform var(--duration-fast) var(--curve-decelerate-min)`
    - Normal color: `background-color: var(--color-accent-8)`
    - Error color: `background-color: var(--color-danger-8)` (via `[data-error="true"]` and `[data-invalid]` selectors)
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 2. Implement unit tests
  - Create `apps/web/components/ui/input.test.tsx` (co-located)
    - Test base class names are present (background, text, placeholder)
    - Test `hasError={false}` applies normal border class
    - Test `hasError={true}` applies danger border class
    - Test disabled state applies opacity and cursor styles
    - Test `ref` forwarding works correctly (React 19 pattern)
    - Test `data-invalid` attribute applies danger border styling (Radix Form integration)
    - Test wrapper div has `relative` class for focus indicator positioning
    - Test input has `input-with-focus-indicator` class
    - Test `data-error` attribute is set correctly based on `hasError` prop
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 3. Update showcase page
  - Update `apps/web/app/(dev)/components/input/page.tsx`
    - Add Radix Form integration example with validation
    - Show manual error control example (`hasError` prop)
    - Show disabled state example
    - Show placeholder example
    - Add focused state example to demonstrate animated focus indicator
    - Organize examples with clear labels and descriptions
  - _Requirements: 6_

- [x] 4. Verify all tests pass
  - Run `npm run test -w @mini-slack/web` and confirm all Input tests pass
