# Design Document: Spinner Component

## Overview

This document describes the technical design for the `Spinner` UI component in MiniSlack. The Spinner is built with CSS masking and conic gradients (ported from Fluent UI's implementation) and styled with Fluent Design System tokens via Tailwind CSS v4. It supports multiple sizes and appearance variants.

The component lives in `apps/web/components/ui/spinner.tsx` with co-located unit tests.

---

## Architecture

### File Structure

```
apps/web/components/ui/
├── spinner.tsx       ← CSS masking + conic-gradient animation
└── spinner.test.tsx  ← co-located unit tests
```

---

## Component Interface

### SpinnerProps

```typescript
import { type VariantProps } from "tailwind-variants";

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  size?: "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  appearance?: "primary" | "inverted";
  className?: string;
}
```

---

## Implementation Details

### Variant Management

Uses `tailwind-variants` `tv()` with `slots` pattern for multi-element styling:

```typescript
import { tv } from "tailwind-variants";

const spinnerVariants = tv({
  slots: {
    root: "inline-flex relative",
    track: "absolute inset-0 rounded-full",
    tail: "absolute inset-0 rounded-full spinner-tail",
    label: "sr-only",
  },
  variants: {
    size: {
      "3xs": { root: "w-4 h-4", track: "[--stroke-width:var(--stroke-width-thick)]", tail: "[--stroke-width:var(--stroke-width-thick)]" },
      "2xs": { root: "w-5 h-5", track: "[--stroke-width:var(--stroke-width-thick)]", tail: "[--stroke-width:var(--stroke-width-thick)]" },
      "xs": { root: "w-6 h-6", track: "[--stroke-width:var(--stroke-width-thick)]", tail: "[--stroke-width:var(--stroke-width-thick)]" },
      "sm": { root: "w-7 h-7", track: "[--stroke-width:var(--stroke-width-thick)]", tail: "[--stroke-width:var(--stroke-width-thick)]" },
      "md": { root: "w-8 h-8", track: "[--stroke-width:var(--stroke-width-thicker)]", tail: "[--stroke-width:var(--stroke-width-thicker)]" },
      "lg": { root: "w-9 h-9", track: "[--stroke-width:var(--stroke-width-thicker)]", tail: "[--stroke-width:var(--stroke-width-thicker)]" },
      "xl": { root: "w-10 h-10", track: "[--stroke-width:var(--stroke-width-thicker)]", tail: "[--stroke-width:var(--stroke-width-thicker)]" },
      "2xl": { root: "w-11 h-11", track: "[--stroke-width:var(--stroke-width-thickest)]", tail: "[--stroke-width:var(--stroke-width-thickest)]" },
    },
    appearance: {
      primary: { track: "bg-accent-a4", tail: "text-accent-9" },
      inverted: { track: "bg-white/25", tail: "text-white" },
    },
  },
  defaultVariants: {
    size: "md",
    appearance: "primary",
  },
});
```

### Animation Structure

The Spinner uses a two-layer structure:

1. **Track** (static background ring):
   - Rendered as a `<div>` with `rounded-full` and background color
   - Uses CSS masking to create a ring shape (donut)

2. **Tail** (animated arc):
   - Rendered as a `<div>` with `spinner-tail` class
   - Uses `::before` and `::after` pseudo-elements
   - Each pseudo-element rotates independently using `@keyframes`
   - Creates a smooth rotating arc effect

### CSS Animation

The animation is defined in `globals.css`:

```css
@keyframes spinner-tail {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-tail::before,
.spinner-tail::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  mask: conic-gradient(from 0deg, transparent 0%, currentColor 25%, transparent 25%);
  animation: spinner-tail 1.5s linear infinite;
}

.spinner-tail::after {
  animation-delay: -0.75s;
}
```

### Accessibility

- `role="status"` on root element
- Visually-hidden `<span className="sr-only">Loading...</span>` for screen readers
- `data-spinner` attribute for testing and selection

---

## Size and Stroke Width Mapping

| Size  | Dimensions | Stroke width token       |
|-------|------------|--------------------------|
| `3xs` | 16px (w-4) | `--stroke-width-thick`   |
| `2xs` | 20px (w-5) | `--stroke-width-thick`   |
| `xs`  | 24px (w-6) | `--stroke-width-thick`   |
| `sm`  | 28px (w-7) | `--stroke-width-thick`   |
| `md`  | 32px (w-8) | `--stroke-width-thicker` |
| `lg`  | 36px (w-9) | `--stroke-width-thicker` |
| `xl`  | 40px (w-10)| `--stroke-width-thicker` |
| `2xl` | 44px (w-11)| `--stroke-width-thickest`|

---

## Appearance Token Mapping

| Appearance | Track color      | Arc color (tail) |
|------------|------------------|------------------|
| `primary`  | `bg-accent-a4`   | `text-accent-9`  |
| `inverted` | `bg-white/25`    | `text-white`     |

---

## Testing Strategy

### Co-located Unit Tests (`spinner.test.tsx`)

- Renders Spinner and verifies `role="status"` is present
- Verifies visually-hidden "Loading..." text is present
- Verifies `data-spinner` attribute is present
- Tests each size variant renders correct dimensions
- Tests each appearance variant renders correct colors

---

## Dependencies

- `tailwind-variants` — variant management with slots
- Fluent Design System tokens in `apps/web/app/globals.css`
- CSS stroke width tokens: `--stroke-width-thick`, `--stroke-width-thicker`, `--stroke-width-thickest`
