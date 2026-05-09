# Design Document: Input Component

## Overview

This document describes the technical design for the `Input` UI component in MiniSlack. The Input is a styled text input primitive built with Fluent Design System tokens via Tailwind CSS v4. It supports error states, integrates with `data-invalid` attribute-based validation, and uses React 19's native `ref` prop pattern (no `forwardRef` wrapper).

The component lives in `apps/web/components/ui/input/` with co-located unit tests.

---

## Architecture

### File Structure

```
apps/web/components/ui/input/
├── input.tsx       ← styled Input component
└── input.test.tsx  ← co-located unit tests
```

---

## Component Interface

### InputProps

```typescript
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>;
  /** Renders the input in an error state with a danger-colored focus indicator. */
  hasError?: boolean;
  /** Content rendered to the left of the input (icon, currency symbol, etc.). */
  before?: ReactNode;
  /** Content rendered to the right of the input (icon, unit label, etc.). */
  after?: ReactNode;
  /** Class applied to the outer wrapper div. */
  wrapperClassName?: string;
}
```

**Note**: In React 19+, `ref` is a regular prop and does not require `forwardRef`. The component accepts `ref` directly in its props interface.

---

## Implementation Details

### React 19 Ref Pattern

React 19 allows components to accept `ref` as a regular prop without using `forwardRef`:

```typescript
export function Input({ className, wrapperClassName, hasError, before, after, ref, ...props }: InputProps) {
  // ...
  return (
    <div className={wrapper({ class: wrapperClassName })}>
      <input ref={ref} className={input({ class: className })} {...props} />
      {/* ... */}
    </div>
  );
}
```

### Styling Approach

The Input uses `tailwind-variants` (`tv`) to define a multi-slot component with conditional variants. This replaces the `cn()` / `clsx` + `tailwind-merge` approach.

```typescript
import { type VariantProps, tv } from "tailwind-variants";

const inputVariants = tv({
  slots: {
    wrapper: [ /* wrapper div styles */ ],
    before:  [ /* left adornment styles */ ],
    after:   [ /* right adornment styles */ ],
    input:   [ /* <input> element styles */ ],
    indicator: [ /* animated focus indicator span styles */ ],
  },
  variants: {
    hasError: {
      true: {
        wrapper: "border-b-danger-9",
        indicator: "bg-danger-9",
      },
    },
  },
});
```

The component renders a **wrapper div** containing the `<input>` and a sibling `<span>` that acts as the animated focus indicator. This is more flexible than a `::after` pseudo-element because it allows the indicator to be styled independently and avoids `overflow: hidden` clipping issues.

### DOM Structure

```html
<div class="wrapper ...">          <!-- wrapper slot -->
  <span class="before ...">...</span>  <!-- optional before adornment -->
  <input class="input ..." />          <!-- input slot (peer) -->
  <span class="after ...">...</span>   <!-- optional after adornment -->
  <span aria-hidden class="indicator ..."></span>  <!-- animated focus indicator -->
</div>
```

### Animated Focus Indicator

The focus indicator is a `<span>` absolutely positioned over the wrapper, clipped to show only the bottom 2px via `clip-path`. It animates from `scaleX(0)` to `scaleX(1)` when the sibling `<input>` receives keyboard focus, using the Tailwind `peer`/`peer-focus-visible` pattern.

```
indicator slot classes:
  "absolute inset-0 z-1"
  "[clip-path:inset(calc(100%-2px)_0_0)]"   ← shows only bottom 2px
  "rounded-b-sm"
  "bg-accent-9"                              ← normal color
  "scale-x-0 peer-focus-visible:scale-x-100" ← animation trigger
  "transition-transform duration-faster ease-decelerate-mid"
  "pointer-events-none"
  "group-has-data-invalid:bg-danger-9"       ← error color via :has()
```

Motion tokens used:
- Duration: `duration-faster` → `--transition-duration-faster` (100ms)
- Easing: `ease-decelerate-mid` → `--ease-decelerate-mid` (`cubic-bezier(0, 0.5, 0, 1)`)

### Error State

The Input supports two error state mechanisms that can be used independently or together:

1. **Manual control via `hasError` prop** — applies the `hasError: true` variant directly:
   ```typescript
   <Input hasError={emailError !== null} />
   ```
   - Wrapper gets `border-b-danger-9`
   - Indicator gets `bg-danger-9`
   - Input gets `data-error` attribute (present when `true`, absent otherwise)

2. **`data-invalid` attribute** — applied externally (e.g. by a form library or manually):
   ```typescript
   <Input data-invalid={isInvalid || undefined} />
   ```
   - Wrapper uses `has-data-invalid:border-b-danger-9` (CSS `:has()` selector, always in className)
   - Indicator uses `group-has-data-invalid:bg-danger-9` (Tailwind `group` + `group-has-*`)

Both mechanisms produce the same visual result. The `group` class on the wrapper enables the `group-has-*` selectors on the indicator span.

### Disabled State

Disabled styling is handled on the wrapper using CSS `:has()`:
- `has-disabled:opacity-50` — reduces opacity when the child input is disabled
- `has-disabled:cursor-not-allowed` — changes cursor on the entire wrapper

This avoids needing to pass `disabled` down to the wrapper explicitly.

### Adornments

The `before` and `after` props accept any `ReactNode` and render in `<span>` elements flanking the input. Common uses: currency symbols, units, icons, keyboard shortcuts.

```typescript
<Input before="$" after="USD" placeholder="0.00" />
<Input before="https://" placeholder="example.com" />
```

---

## Token Mapping

| Slot / State       | Token                                      |
|--------------------|--------------------------------------------|
| Wrapper background | `bg-white-a2`                              |
| Wrapper border     | `border-gray-a6 border-b-gray-a10`         |
| Wrapper border (error) | `border-b-danger-9`                    |
| Input text         | `text-gray-12`                             |
| Input placeholder  | `placeholder:text-gray-a9`                 |
| Indicator (normal) | `bg-accent-9`                              |
| Indicator (error)  | `bg-danger-9`                              |
| Focus duration     | `duration-faster` (100ms)                  |
| Focus easing       | `ease-decelerate-mid`                      |

---

## Form Validation Integration

Since `@radix-ui/react-form` is not installed, form validation is handled via native HTML constraint validation and the `data-invalid` attribute pattern.

### Native Form Validation Example

```typescript
"use client";

export function FormValidationExample() {
  const [emailInvalid, setEmailInvalid] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);
    // handle success
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        ref={emailRef}
        type="email"
        required
        data-invalid={emailInvalid || undefined}
        onChange={() => {
          if (emailRef.current?.validity.valid) setEmailInvalid(false);
        }}
      />
    </form>
  );
}
```

The showcase page at `/components/input` includes a live `FormValidationExample` client component demonstrating this pattern.

### Manual Error Control

```typescript
<Input hasError={emailError !== null} />
```

---

## Testing Strategy

### Co-located Unit Tests (`input.test.tsx`)

Tests use `@testing-library/react` with `jsdom` environment and verify:

- Wrapper has `bg-white-a2` class
- Input has `text-gray-12` and `placeholder:text-gray-a9` classes
- Wrapper has `relative` class for focus indicator positioning
- Input has `peer` class for focus indicator animation
- `hasError` omitted/false: wrapper has `border-b-gray-a10`, does NOT have bare `border-b-danger-9`
- `hasError={true}`: wrapper has `border-b-danger-9`
- `hasError={true}`: input has `data-error` attribute; false/omitted: attribute is absent
- Disabled: wrapper has `has-disabled:opacity-50` and `has-disabled:cursor-not-allowed`
- `ref` forwarding: `ref.current` points to the `<input>` element (React 19 pattern)
- Wrapper always has `has-data-invalid:border-b-danger-9` (static CSS `:has()` class)
- `before` adornment renders before the input
- `after` adornment renders after the input

---

## Dependencies

- `tailwind-variants` — multi-slot variant-based class composition
- Fluent Design System tokens in `apps/web/components/ui/styles/tokens/`
- Motion tokens: `duration-faster` (100ms), `ease-decelerate-mid` — defined in `motion.css`
- React 19+ — for native `ref` prop support
