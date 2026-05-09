# Design Document: Label Component

## Overview

This document describes the technical design for the `Label` UI component in MiniSlack. The Label is a styled label primitive built with Fluent Design System tokens via Tailwind CSS v4. It supports size variants, a disabled state, and an optional required-field indicator.

The component lives in `apps/web/components/ui/label/label.tsx` with co-located unit tests, following the same conventions as the Button component.

---

## Architecture

### File Structure

```
apps/web/components/ui/label/
├── label.tsx            ← component + tv() variants
└── label.test.tsx       ← co-located unit tests

apps/web/app/(dev)/components/label/
└── page.tsx             ← developer showcase page
```

No CSS module file is used. All styling is handled inline via `tailwind-variants`.

---

## Components and Interfaces

### LabelProps

```typescript
import { type Ref } from "react";
import { type VariantProps, tv } from "tailwind-variants";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  ref?: Ref<HTMLLabelElement>;
  required?: boolean | string | JSX.Element;
  disabled?: boolean;
}
```

`size` is inferred from `VariantProps<typeof labelVariants>` and typed as `"sm" | "default" | "lg" | undefined`. `ref` is a plain prop in React 19 — no `forwardRef` wrapper needed.

---

## Data Models

### labelVariants (`tv()` configuration)

Follows the exact same pattern as `buttonVariants` in `apps/web/components/ui/button/button.tsx`.

```typescript
const labelVariants = tv({
  base: "inline-flex items-center text-gray-12 font-medium",
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    size: "default",
  },
});
```

### Required Indicator Logic

The `required` prop drives conditional rendering after the label text:

| `required` value      | Rendered output                                                        |
|-----------------------|------------------------------------------------------------------------|
| `true`                | `<span className="text-danger-9 ml-0.5">*</span>`                     |
| non-empty string      | `<span className="ml-0.5">{required}</span>`                           |
| JSX element           | `<span className="ml-0.5">{required}</span>`                           |
| `false` / `undefined` | nothing                                                                |

---

## Implementation Details

### Full Component

```typescript
import { type Ref } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const labelVariants = tv({
  base: "inline-flex items-center text-gray-12 font-medium",
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  ref?: Ref<HTMLLabelElement>;
  required?: boolean | string | JSX.Element;
  disabled?: boolean;
}

export function Label({
  className,
  size,
  disabled,
  required,
  children,
  ...props
}: LabelProps) {
  const requiredIndicator = required === true ? (
    <span className="text-danger-9 ml-0.5">*</span>
  ) : required ? (
    <span className="ml-0.5">{required}</span>
  ) : null;

  return (
    <label
      className={labelVariants({ size, disabled, className })}
      {...props}
    >
      {children}
      {requiredIndicator}
    </label>
  );
}
```

### Accessibility

- Uses native `<label>` element for proper form association via `htmlFor`.
- The required indicator is purely visual; screen readers will read the label text naturally. If a field is required, the associated `<input>` should carry `aria-required="true"` for full accessibility.
- The `disabled` prop is visual-only on the label; the associated input must also be disabled.

---

## Token Mapping

| Property              | Token / Class                    | Condition                        |
|-----------------------|----------------------------------|----------------------------------|
| Text color            | `text-gray-12`                   | Always                           |
| Font weight           | `font-medium`                    | Always                           |
| Font size — sm        | `text-xs`                        | `size="sm"`                      |
| Font size — default   | `text-sm`                        | `size="default"` or omitted      |
| Font size — lg        | `text-base`                      | `size="lg"`                      |
| Disabled opacity      | `opacity-50`                     | `disabled={true}`                |
| Disabled cursor       | `cursor-not-allowed`             | `disabled={true}`                |
| Required indicator    | `text-danger-9 ml-0.5`           | `required={true}` (asterisk)     |
| Custom indicator      | `ml-0.5`                         | `required` is string or JSX      |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Custom required string is always rendered

*For any* non-empty string passed as the `required` prop, the rendered label output SHALL contain that exact string.

**Validates: Requirements 3.2**

---

## Error Handling

- If `required` is an empty string (`""`), it is falsy in JavaScript and no indicator is rendered — consistent with the `false`/`undefined` case.
- The component does not throw for any valid prop combination.
- Custom `className` is merged via `tailwind-variants`' built-in class merging (no separate `cn()` call needed).

---

## Testing Strategy

### Co-located Unit Tests (`label.test.tsx`)

**Example-based tests** cover the specific, concrete behaviors:

- Renders a `<label>` element as the root node
- Base classes `text-gray-12` and `font-medium` are always present
- `htmlFor` is forwarded to the underlying `<label>` element
- Custom `className` is merged with base styles
- `required={true}` renders an asterisk (`*`) with `text-danger-9`
- `required="(required)"` renders the custom string
- `required={<span>custom</span>}` renders the custom JSX element
- `required={false}` and no `required` prop render no indicator
- `disabled={true}` applies `opacity-50` and `cursor-not-allowed`
- `disabled={false}` / no `disabled` prop applies neither class
- `size="sm"` applies `text-xs`
- `size="default"` applies `text-sm`
- `size="lg"` applies `text-base`
- Omitting `size` defaults to `text-sm`

**Property-based tests** (`label.property.test.tsx`) use `fast-check`:

- **Property 1** — For any non-empty string passed as `required`, the rendered output contains that string.
  - Generator: `fc.string({ minLength: 1 })`
  - Assertion: rendered label text content includes the generated string
  - Minimum 100 iterations
  - Tag: `Feature: apps.web.common-ui.label, Property 1: Custom required string is always rendered`

### Showcase Page (`app/(dev)/components/label/page.tsx`)

Manual visual verification covers Requirement 6. The page renders:

- Standalone label
- Label paired with an `<input>` via `htmlFor`
- `required={true}` (default asterisk)
- `required="(required)"` (custom string)
- `required={<span>✦</span>}` (custom JSX)
- `disabled={true}` paired with a disabled input
- All three size variants: `sm`, `default`, `lg`

### Why PBT is limited here

Most Label acceptance criteria are specific class-name or attribute checks (EXAMPLE classification). The only criterion with meaningful input variation is 3.2 (arbitrary string content for the required indicator), which is covered by Property 1. All other criteria are best verified with focused example-based unit tests.

---

## Dependencies

- `tailwind-variants` — variant-driven class composition (already used by Button)
- Fluent Design System tokens in `apps/web/app/globals.css`
