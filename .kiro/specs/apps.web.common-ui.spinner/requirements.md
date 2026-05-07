# Requirements Document: Spinner Component

## Introduction

This feature delivers the `Spinner` UI component for MiniSlack. It provides a reusable, accessible loading indicator built with CSS masking and conic gradients (ported from Fluent UI's Spinner implementation). The component supports multiple sizes and appearance variants, and is styled with Microsoft's Fluent Design System tokens via Tailwind CSS v4.

The Spinner component lives in `apps/web/components/ui/spinner.tsx` and is consumed by the Button component and other loading states throughout the application.

## Glossary

- **Spinner**: An animated loading indicator component using CSS masking + conic-gradient.
- **Fluent_Tokens**: The Radix UI color scale CSS variables (`--color-accent-*`, `--color-gray-*`, etc.) defined in `globals.css`.
- **Track**: The static background ring of the spinner.
- **Tail**: The animated arc that rotates around the track.

---

## Requirements

### Requirement 1: Spinner Size Variants

**User Story:** As a developer, I want a Spinner component with multiple size variants, so that I can match the spinner size to the UI context.

#### Acceptance Criteria

1. THE Spinner SHALL accept a `size` prop with variants: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`.
2. WHEN a Spinner has `size="3xs"`, THE Spinner SHALL have dimensions `16px` (w-4 h-4).
3. WHEN a Spinner has `size="2xs"`, THE Spinner SHALL have dimensions `20px` (w-5 h-5).
4. WHEN a Spinner has `size="xs"`, THE Spinner SHALL have dimensions `24px` (w-6 h-6).
5. WHEN a Spinner has `size="sm"`, THE Spinner SHALL have dimensions `28px` (w-7 h-7).
6. WHEN a Spinner has `size="md"`, THE Spinner SHALL have dimensions `32px` (w-8 h-8).
7. WHEN a Spinner has `size="lg"`, THE Spinner SHALL have dimensions `36px` (w-9 h-9).
8. WHEN a Spinner has `size="xl"`, THE Spinner SHALL have dimensions `40px` (w-10 h-10).
9. WHEN a Spinner has `size="2xl"`, THE Spinner SHALL have dimensions `44px` (w-11 h-11).

---

### Requirement 2: Spinner Appearance Variants

**User Story:** As a developer, I want a Spinner component with appearance variants, so that I can use the appropriate color scheme for different contexts.

#### Acceptance Criteria

1. THE Spinner SHALL accept an `appearance` prop with variants: `primary`, `inverted`.
2. WHEN a Spinner has `appearance="primary"`, THE track SHALL use `bg-accent-a4` and THE tail SHALL use `text-accent-9`.
3. WHEN a Spinner has `appearance="inverted"`, THE track SHALL use `bg-white/25` and THE tail SHALL use `text-white`.

---

### Requirement 3: Accessibility

**User Story:** As a user with assistive technology, I want the Spinner to be announced as a loading indicator, so that I know content is being loaded.

#### Acceptance Criteria

1. THE Spinner SHALL have `role="status"` on its root element.
2. THE Spinner SHALL render a visually-hidden `<span>Loading...</span>` for screen readers.
3. THE Spinner SHALL have a `data-spinner` attribute on its root element for testing and selection.

---

### Requirement 4: Animation Implementation

**User Story:** As a developer, I want the Spinner to use CSS-based animation (not SVG stroke-dasharray), so that the animation is smooth and performant.

#### Acceptance Criteria

1. THE Spinner SHALL use CSS masking + conic-gradient for the animated arc (ported from Fluent UI).
2. THE Spinner SHALL use a two-layer structure: static track ring + animated tail ring.
3. THE tail animation SHALL use `::before` and `::after` pseudo-elements rotating independently.
4. THE animation SHALL be rotation-based (no `stroke-dasharray` or discrete interpolation).

---

### Requirement 5: TypeScript Types

**User Story:** As a developer, I want the Spinner component to be fully typed, so that I get autocomplete and type safety.

#### Acceptance Criteria

1. THE Spinner SHALL export a `SpinnerProps` interface.
2. THE `SpinnerProps` interface SHALL extend `VariantProps<typeof spinnerVariants>` from `tailwind-variants`.
3. THE `SpinnerProps` interface SHALL include `size`, `appearance`, and `className` props.


---

### Requirement 6: Developer Showcase Page

**User Story:** As a developer, I want a dedicated showcase page for the Spinner component at `/components/spinner`, so that I can view all Spinner variants in one place.

#### Acceptance Criteria

1. THE Spinner showcase page SHALL be accessible at `/components/spinner`.
2. THE Spinner showcase page SHALL render all Spinner `size` variants: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`.
3. THE Spinner showcase page SHALL render all Spinner `appearance` variants: `primary`, `inverted`.
4. THE Spinner showcase page SHALL organize variants in a clear, scannable layout with labels.
5. THE Spinner showcase page SHALL display each size variant with its dimension label (e.g., "3xs (16px)").
