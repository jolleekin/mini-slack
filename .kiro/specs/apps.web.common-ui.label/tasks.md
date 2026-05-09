# Implementation Plan: Label Component

## Overview

Build the `Label` UI component with Fluent Design System tokens and `tailwind-variants`. The component lives in `apps/web/components/ui/label/label.tsx` with co-located unit and property tests.

## Tasks

- [x] 1. Implement the Label component
  - Create `apps/web/components/ui/label/label.tsx`
    - Import `tv` and `VariantProps` from `tailwind-variants`
    - Define `labelVariants` using `tv()` with:
      - Base classes: `inline-flex items-center text-gray-12 font-medium`
      - `size` variants: `sm` → `text-xs`, `default` → `text-sm`, `lg` → `text-base`
      - `disabled` variant: `true` → `opacity-50 cursor-not-allowed`
      - `defaultVariants`: `{ size: "default" }`
    - Export `LabelProps` interface extending `React.LabelHTMLAttributes<HTMLLabelElement>` and `VariantProps<typeof labelVariants>`, adding `ref?: Ref<HTMLLabelElement>`, `required?: boolean | string | JSX.Element`, and `disabled?: boolean`
    - Use a plain function component — no `React.forwardRef` (React 19: `ref` is a regular prop)
    - Render `required` indicator:
      - If `required === true`: render `<span className="text-danger-9 ml-0.5">*</span>`
      - If `required` is a string or JSX element: render `<span className="ml-0.5">{required}</span>`
      - Otherwise: render nothing
    - Wrap `children` and the required indicator directly inside the `<label>` — no wrapper span needed since `inline-flex items-center` is applied to the label itself
    - Pass `htmlFor` and all other label attributes through via spread
    - Set `Label.displayName = "Label"`
    - Do NOT use a CSS module file — all styling via `tailwind-variants`
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 2. Implement unit tests
  - Create `apps/web/components/ui/label/label.test.tsx` (co-located)
    - Test root element is a `<label>` tag
    - Test base classes `text-gray-12` and `font-medium` are always present
    - Test `htmlFor` is forwarded to the underlying `<label>` element
    - Test custom `className` is merged with base styles
    - Test `required={true}` renders `*` with `text-danger-9` class
    - Test `required="(required)"` renders the custom string
    - Test `required={<span>custom</span>}` renders the custom JSX element
    - Test `required={false}` renders no indicator
    - Test omitting `required` renders no indicator
    - Test `disabled={true}` applies `opacity-50` and `cursor-not-allowed`
    - Test `disabled={false}` / no `disabled` prop applies neither class
    - Test `size="sm"` applies `text-xs`
    - Test `size="default"` applies `text-sm`
    - Test `size="lg"` applies `text-base`
    - Test omitting `size` defaults to `text-sm`
  - _Requirements: 1, 3, 4, 5_

- [x] 3. Implement property-based tests
  - Create `apps/web/components/ui/label/label.property.test.tsx` (co-located)
    - Use `fast-check` for property generation
    - **Property 1** — For any non-empty string passed as `required`, the rendered label output contains that string
      - Generator: `fc.string({ minLength: 1 })`
      - Assertion: rendered text content includes the generated string
      - Configure minimum 100 iterations
      - Tag comment: `Feature: apps.web.common-ui.label, Property 1: Custom required string is always rendered`
  - _Requirements: 3_

- [x] 4. Update the developer showcase page
  - Update `apps/web/app/(dev)/components/label/page.tsx`
    - Import `Label` from `@/components/ui/label/label.tsx`
    - Remove the placeholder message
    - Add section: Standalone Label
    - Add section: Label with `htmlFor` paired with an `<input>`
    - Add section: Required indicator — `required={true}` (asterisk), `required="(required)"` (custom string), `required={<span>✦</span>}` (custom JSX)
    - Add section: Disabled state — `disabled={true}` paired with a disabled input
    - Add section: Size variants — `size="sm"`, `size="default"`, `size="lg"` side by side
    - Organize sections with the existing `Section` wrapper component and clear descriptions
  - _Requirements: 6_

- [x] 5. Verify all tests pass
  - Run `npm run test -w @mini-slack/web` and confirm all Label tests pass (unit + property)
