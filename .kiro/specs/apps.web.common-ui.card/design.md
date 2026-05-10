# Design Document: Card Component

## Overview

The `Card` component is a surface container primitive for MiniSlack's UI. It follows the Fluent Design System's card model — appearance variants, size tokens, orientation, selection, and disabled state — implemented with Tailwind CSS v4 and `tailwind-variants`.

---

## Architecture

### File Structure

```
apps/web/components/ui/card/
├── card.tsx       ← component + variant definitions
└── card.test.tsx  ← co-located unit tests

apps/web/app/(dev)/components/card/
├── page.tsx            ← showcase page
└── selectable-card.tsx ← stateful usage example
```

---

## Component Interface

```typescript
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Visual style variant. Default: 'filled' */
  appearance?: "filled" | "filled-alternative" | "outline" | "subtle";
  /** Controls padding and gap via --card-size token. Default: 'medium' */
  size?: "small" | "medium" | "large";
  /** Flex direction of card contents. Default: 'vertical' */
  orientation?: "vertical" | "horizontal";
  /** Styling-only selected state — parent owns the state. Default: false */
  selected?: boolean;
  /** Adds aria-disabled, data-disabled, opacity-50, cursor-not-allowed. Default: false */
  disabled?: boolean;
}
```

`ref` and all standard `HTMLDivElement` attributes are forwarded via `...props`.

---

## Implementation Details

### Variant System

Uses `tailwind-variants` (`tv`) — the same library used by `Button`. This gives compound variant support and consistent className merging without a separate `cn()` utility.

### Size Token

Size is implemented as a single CSS custom property `--card-size` that drives both `padding` and `gap` simultaneously:

```
small  → --card-size: 8px   (p-2 / gap-2 equivalent)
medium → --card-size: 12px  (p-3 / gap-3 equivalent)  [default]
large  → --card-size: 16px  (p-4 / gap-4 equivalent)
```

The base classes `p-(--card-size)` and `gap-(--card-size)` consume this token. Consumers can override with an inline style for custom sizes:

```tsx
<Card style={{ "--card-size": "24px" } as CSSProperties} />
```

### Appearance Variants

| Variant              | Background    | Border          | Shadow   |
|----------------------|---------------|-----------------|----------|
| `filled` (default)   | `bg-gray-2`   | `border-gray-a6`| `shadow-sm` |
| `filled-alternative` | `bg-gray-3`   | `border-gray-a6`| `shadow-sm` |
| `outline`            | transparent   | `border-gray-a6`| none     |
| `subtle`             | transparent   | transparent     | none, `hover:bg-gray-a2` |

### Selected State

`selected` is a **styling prop** — the parent component owns the boolean state and passes it down. This follows the controlled pattern and keeps `Card` as a pure presentational primitive.

When `selected=true`:
- Default: `border-accent-8 bg-accent-2`
- Outline: `border-accent-8` (background stays transparent)
- Subtle: `bg-accent-2` (border stays transparent)

These are handled via compound variants in `tv`.

### Disabled State

When `disabled=true`:
- `opacity-50 cursor-not-allowed` applied via variant
- `aria-disabled="true"` set on the element (not `disabled` attribute — it's a `div`)
- `data-disabled="true"` for CSS selector targeting

### Accessibility

- `role="group"` by default, overridable via prop
- `aria-disabled` for screen reader announcement of disabled state
- `data-selected` / `data-disabled` attributes for CSS and testing hooks

### Implementation

```typescript
export function Card({
  className,
  appearance,
  size,
  orientation,
  selected = false,
  disabled = false,
  role = "group",
  ...props  // includes ref, event handlers, aria-*, data-*, etc.
}: CardProps) {
  return (
    <div
      role={role}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-selected={selected || undefined}
      className={cardVariants({ appearance, size, orientation, selected, disabled, className })}
      {...props}
    />
  );
}
```

### Usage Examples

```tsx
// Basic
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>

// Variants
<Card appearance="outline" size="small" orientation="horizontal">
  <img src="..." />
  <span>Label</span>
</Card>

// Controlled selection (parent owns state)
const [selected, setSelected] = useState(false);
<Card selected={selected} onClick={() => setSelected(s => !s)}>
  Content
</Card>

// Custom size token
<Card style={{ "--card-size": "24px" } as CSSProperties}>
  Content
</Card>
```

---

## Testing Strategy

Co-located unit tests in `card.test.tsx` cover:

- Children rendering
- `role="group"` default and custom role override
- Ref forwarding via `...props`
- HTML attribute passthrough
- All four appearance variants (class presence)
- All three size variants (`--card-size` token class)
- Both orientation values
- Selected state: class application and `data-selected` attribute
- Disabled state: `aria-disabled`, `data-disabled`, `opacity-50` class

---

## Dependencies

- `tailwind-variants` — variant class composition (already used by `Button`)
- Radix color tokens via Tailwind CSS v4 (`bg-gray-2`, `border-gray-a6`, `bg-accent-2`, etc.)
