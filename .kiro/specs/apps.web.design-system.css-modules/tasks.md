# Implementation Plan: CSS Modules Refactoring

## Overview

This plan refactors the monolithic `apps/web/app/globals.css` file (500+ lines) into a modular CSS architecture co-located with React components. The refactoring creates a single entrypoint (`components/ui/index.css`) that imports token modules (colors, motion), utilities, and component-specific styles. All existing token references remain unchanged, ensuring backward compatibility.

## Tasks

- [x] 1. Create directory structure and design system entrypoint
  - Create `apps/web/components/ui/styles/tokens/` directory
  - Create `apps/web/components/ui/spinner/` directory (if not exists)
  - Create `apps/web/components/ui/input/` directory (if not exists)
  - Create `apps/web/components/ui/index.css` with import statements in correct dependency order (colors, motion, shadows, utilities, component styles)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 2. Create color tokens module
  - [x] 2.1 Extract color tokens from globals.css to new module
    - Create `apps/web/components/ui/styles/tokens/colors.css`
    - Copy all Radix color scale imports from `globals.css`
    - Copy all color token definitions (purple, gray, green, red, orange, white-alpha, black-alpha scales)
    - Copy semantic aliases (accent, success, danger, warning)
    - Copy contrast color tokens
    - Wrap all token definitions in `@theme inline` directive
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 10.1, 10.4, 11.1_

- [x] 3. Create motion tokens module
  - [x] 3.1 Create motion tokens file with duration and easing tokens
    - Create `apps/web/components/ui/styles/tokens/motion.css`
    - Define 8 duration tokens (ultra-fast through ultra-slow)
    - Define 9 easing curve tokens with cubic-bezier functions
    - Wrap all token definitions in `@theme inline` directive
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 10.1, 10.4, 12.1, 12.2, 12.3_

- [x] 3.2 Create shadow tokens module
  - Create `apps/web/components/ui/styles/tokens/shadows.css`
  - Define shadow color tokens (neutral-shadow-ambient, neutral-shadow-key, brand-shadow-ambient, brand-shadow-key)
  - Define 6 neutral elevation shadows (shadow-2, shadow-4, shadow-8, shadow-16, shadow-28, shadow-64)
  - Define 6 brand elevation shadows (shadow-2-brand, shadow-4-brand, shadow-8-brand, shadow-16-brand, shadow-28-brand, shadow-64-brand)
  - Wrap all token definitions in `@theme inline` directive
  - _Requirements: 6.1, 6.6, 10.1, 10.4_

- [x] 4. Create utilities module
  - [x] 4.1 Extract utilities and stroke width tokens
    - Create `apps/web/components/ui/styles/utilities.css`
    - Copy stroke width tokens from `globals.css`
    - Copy `.fluent-focus-ring` utility class definition
    - Wrap stroke width tokens in `@theme inline` directive
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.4, 11.2, 13.4_

- [x] 5. Create spinner component styles module
  - [x] 5.1 Extract spinner styles to co-located module
    - Create `apps/web/components/ui/spinner/spinner.css`
    - Copy all spinner keyframe animations from `globals.css` (spinner-rotate, spinner-tail, spinner-tail-before, spinner-tail-after)
    - Copy `.spinner-tail` class and pseudo-element styles
    - Copy `@media (prefers-reduced-motion)` block for spinner
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 11.3, 13.3_

- [x] 6. Create input component styles module
  - [x] 6.1 Create input focus indicator styles
    - Create `apps/web/components/ui/input/input.css`
    - Define `.input` class with transition using `--duration-normal` and `--curve-easy-ease`
    - Define `.input:focus-visible` styles using `--color-accent-8`
    - _Requirements: 8.1, 8.3, 8.8, 12.1, 12.2, 13.3_

- [x] 7. Update app globals.css to use design system entrypoint
  - [x] 7.1 Replace globals.css content with minimal imports
    - Backup current `apps/web/app/globals.css` (copy content to clipboard or comment)
    - Replace content with Tailwind import, design system entrypoint import, and font tokens
    - Use correct relative path `../components/ui/index.css` for entrypoint import
    - Keep only `@theme inline` block with font tokens (--font-sans, --font-mono)
    - Remove all color tokens, motion tokens, utilities, and component styles (now in modules)
    - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 9.3, 10.1, 13.6_

- [x] 8. Checkpoint - Verify build and imports
  - Run `npm run build -w @mini-slack/web` to verify no CSS errors
  - Check browser DevTools to verify all tokens are available
  - Verify import path resolution is correct
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 9. Run existing test suite for backward compatibility validation
  - Run `npm run test -w @mini-slack/web` to verify all tests pass
  - Verify Button component tests pass without modification
  - Verify Spinner component tests pass without modification
  - Verify landing page component tests pass without modification
  - _Requirements: 11.4, 11.5_

- [x] 10. Manual testing of design system showcase pages
  - Start dev server with `npm run dev -w @mini-slack/web`
  - Test `/components/button` page - verify all button variants render correctly
  - Test `/components/spinner` page - verify all spinner sizes and appearances animate correctly
  - Test `/components/input` page - verify focus indicator animates with correct duration/easing
  - Test landing page `/` - verify hero section, CTA buttons, and footer render correctly
  - Tab through interactive elements to verify `.fluent-focus-ring` utility works
  - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests needed (CSS architecture refactoring, not algorithmic logic)
- All existing token names and values remain unchanged for backward compatibility
- Import order in `components/ui/index.css` is critical: tokens → utilities → component styles
- The design system entrypoint enables future extraction to `packages/ui` shared package
