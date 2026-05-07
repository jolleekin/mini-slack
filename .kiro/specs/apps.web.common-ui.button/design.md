# Design Document: Button Component

## Overview

This document describes the technical design for the `Button` UI component in MiniSlack. The Button is built on Radix UI Slot and styled with Fluent Design System tokens via Tailwind CSS v4. It supports multiple appearance variants, sizes, shapes, loading states, and the `asChild` pattern for rendering as any element.

The component lives in `apps/web/components/ui/button.tsx` with co-located unit and property-based tests.

---

## Architecture

### File Structure

```
apps/web/components/ui/
├── button.tsx                  ← Radix Slot + tailwind-variants
├── button.test.tsx             ← co-located unit tests
└── button.property.test.tsx    ← co-located property tests
```

---

## Component Interface

### ButtonProps

```typescript
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "tailwind-variants";

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  appearance?: "default" | "primary" | "success" | "danger" | "warning" | "outline" | "subtle" | "transparent" | "link";
  shape?: "default" | "square" | "circle";
  size?: "default" | "sm" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
}
```

---

## Implementation Details

### Variant Management

Uses `tailwind-variants` `tv()` for variant management:

```typescript
import { tv } from "tailwind-variants";

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors fluent-focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  variants: {
    appearance: {
      default: "bg-gray-a3 text-gray-12 border border-gray-a7 hover:bg-gray-a4 active:bg-gray-a5",
      primary: "bg-accent-9 text-accent-contrast hover:bg-accent-10 active:bg-accent-11",
      success: "bg-success-9 text-success-contrast hover:bg-success-10 active:bg-success-11",
      danger: "bg-danger-9 text-danger-contrast hover:bg-danger-10 active:bg-danger-11",
      warning: "bg-warning-9 text-warning-contrast hover:bg-warning-10 active:bg-warning-11",
      outline: "bg-transparent text-gray-12 border border-gray-a7 hover:bg-gray-a3 active:bg-gray-a4",
      subtle: "bg-transparent text-gray-11 hover:bg-gray-a3 active:bg-gray-a4",
      transparent: "bg-transparent text-gray-11 hover:text-accent-10 active:text-accent-11",
      link: "bg-transparent text-accent-10 hover:underline active:text-accent-11 px-0",
    },
    size: {
      sm: "h-6 px-2 text-xs",
      default: "h-8 px-3 text-sm",
      lg: "h-10 px-4 text-base",
    },
    shape: {
      default: "",
      square: "",
      circle: "rounded-full",
    },
  },
  compoundVariants: [
    {
      shape: ["square", "circle"],
      class: "px-0",
    },
  ],
  defaultVariants: {
    appearance: "default",
    size: "default",
    shape: "default",
  },
});
```

### Radix Slot Integration

The Button uses `@radix-ui/react-slot` to support the `asChild` pattern:

```typescript
const Comp = asChild ? Slot : "button";

return (
  <Comp
    className={buttonVariants({ appearance, size, shape, className })}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <Spinner size={spinnerSize} appearance={spinnerAppearance} />}
    {children}
  </Comp>
);
```

### Loading State

When `isLoading={true}`:
1. Renders a `<Spinner>` component before the children
2. Sets `disabled={true}` on the button
3. Maps button size to spinner size:
   - `sm` → `3xs`
   - `default` → `2xs`
   - `lg` → `sm`
4. Maps button appearance to spinner appearance:
   - `primary` → `inverted`
   - all others → `primary`

### Disabled State

When `disabled={true}` or `isLoading={true}`:
- Applies `opacity-50 cursor-not-allowed pointer-events-none` via the base variant
- Sets the `disabled` attribute on the underlying element
- Hover and active states are overridden by the disabled styles

---

## Variant Token Mapping

| Appearance    | Background      | Text                   | Hover bg         | Active bg        | Border           |
|---------------|-----------------|------------------------|------------------|------------------|------------------|
| `default`     | `bg-gray-a3`    | `text-gray-12`         | `bg-gray-a4`     | `bg-gray-a5`     | `border-gray-a7` |
| `primary`     | `bg-accent-9`   | `text-accent-contrast` | `bg-accent-10`   | `bg-accent-11`   | none             |
| `success`     | `bg-success-9`  | `text-success-contrast`| `bg-success-10`  | `bg-success-11`  | none             |
| `danger`      | `bg-danger-9`   | `text-danger-contrast` | `bg-danger-10`   | `bg-danger-11`   | none             |
| `warning`     | `bg-warning-9`  | `text-warning-contrast`| `bg-warning-10`  | `bg-warning-11`  | none             |
| `outline`     | transparent     | `text-gray-12`         | `bg-gray-a3`     | `bg-gray-a4`     | `border-gray-a7` |
| `subtle`      | transparent     | `text-gray-11`         | `bg-gray-a3`     | `bg-gray-a4`     | none             |
| `transparent` | transparent     | `text-gray-11`         | `text-accent-10` | `text-accent-11` | none             |
| `link`        | transparent     | `text-accent-10`       | underline        | `text-accent-11` | none, `px-0`     |

---

## Testing Strategy

### Co-located Unit Tests (`button.test.tsx`)

- Renders each appearance variant and verifies class output
- Tests `asChild` behavior (renders as child element)
- Verifies focus ring class is present
- Tests size heights (sm=24px, default=32px, lg=40px)
- Tests `isLoading` behavior (disabled attribute + Spinner present)
- Tests `disabled` behavior (disabled attribute + opacity styles)
- Tests shape variants (square and circle override padding)

### Co-located Property-Based Tests (`button.property.test.tsx`)

- **Property 1**: Button loading state implies disabled and Spinner
  - For any combination of `appearance`, `size`, `shape`, when `isLoading={true}`, the button SHALL have `disabled` attribute AND contain `[data-spinner]`
  - `numRuns: 100`

- **Property 2**: Disabled Button always sets the disabled attribute
  - For any Button with `disabled={true}` or `isLoading={true}`, the underlying element SHALL have `disabled` attribute
  - `numRuns: 100`

---

## Dependencies

- `@radix-ui/react-slot` — Slot primitive for `asChild` pattern
- `tailwind-variants` — variant management
- `apps/web/components/ui/spinner.tsx` — Spinner component (separate spec)
- Fluent Design System tokens in `apps/web/app/globals.css`

---

## Correctness Properties

### Property 1: Button loading state implies disabled and Spinner

For any combination of Button `appearance`, `size`, and `shape` props, when `isLoading={true}`, the rendered button element SHALL have the `disabled` attribute set AND SHALL contain a `[data-spinner]` element in its subtree.

**Validates: Requirements 6**

### Property 2: Disabled Button always sets the disabled attribute

For any Button rendered with `disabled={true}` or `isLoading={true}`, the underlying `<button>` DOM element SHALL have the `disabled` attribute present, regardless of `appearance`, `size`, or `shape` variant.

**Validates: Requirements 7**
