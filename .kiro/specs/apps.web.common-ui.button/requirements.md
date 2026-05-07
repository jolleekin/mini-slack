# Requirements Document: Button Component

## Introduction

This feature delivers the `Button` UI component for MiniSlack. It provides a reusable, accessible button primitive built on Radix UI Slot and styled with Microsoft's Fluent Design System tokens via Tailwind CSS v4. The component supports multiple appearance variants, sizes, shapes, loading states, and can render as any element via the `asChild` pattern.

The Button component lives in `apps/web/components/ui/button.tsx` and is consumed by auth pages and all future application pages.

## Glossary

- **Button**: A Radix Slot-based button component with Fluent Design variants.
- **Fluent_Tokens**: The Radix UI color scale CSS variables (`--color-accent-*`, `--color-gray-*`, `--color-danger-*`, etc.) defined in `globals.css`.
- **asChild**: A Radix UI pattern where the component renders as its child element instead of its default element.
- **Spinner**: An animated loading indicator component (separate spec: `apps.web.common-ui.spinner`).

---

## Requirements

### Requirement 1: Button Appearance Variants

**User Story:** As a developer, I want a Button component with multiple appearance variants, so that I can use the appropriate visual style for different contexts.

#### Acceptance Criteria

1. THE Button SHALL accept an `appearance` prop with variants: `default`, `primary`, `success`, `danger`, `warning`, `outline`, `subtle`, `transparent`, `link`.
2. THE Button SHALL implement variant styles using `tailwind-variants` (`tv`) with Fluent_Tokens color scales from `globals.css`.
3. WHEN a Button has `appearance="default"`, THE Button SHALL use `bg-gray-a3` background, `text-gray-12` text, and `border-gray-a7` border.
4. WHEN a Button has `appearance="primary"`, THE Button SHALL use `bg-accent-9` background and `text-accent-contrast` text.
5. WHEN a Button has `appearance="success"`, THE Button SHALL use `bg-success-9` background and `text-success-contrast` text.
6. WHEN a Button has `appearance="danger"`, THE Button SHALL use `bg-danger-9` background and `text-danger-contrast` text.
7. WHEN a Button has `appearance="warning"`, THE Button SHALL use `bg-warning-9` background and `text-warning-contrast` text.
8. WHEN a Button has `appearance="outline"`, THE Button SHALL use transparent background, `text-gray-12` text, and `border-gray-a7` border.
9. WHEN a Button has `appearance="subtle"`, THE Button SHALL use transparent background and `text-gray-11` text with no border.
10. WHEN a Button has `appearance="transparent"`, THE Button SHALL use transparent background and `text-gray-11` text with hover color change.
11. WHEN a Button has `appearance="link"`, THE Button SHALL use transparent background, `text-accent-10` text, and underline on hover.

---

### Requirement 2: Button Size Variants

**User Story:** As a developer, I want a Button component with multiple size variants, so that I can match the button size to the UI context.

#### Acceptance Criteria

1. THE Button SHALL accept a `size` prop with variants: `sm`, `default`, `lg`.
2. WHEN a Button has `size="sm"`, THE Button SHALL have height `h-6` (24px).
3. WHEN a Button has `size="default"`, THE Button SHALL have height `h-8` (32px).
4. WHEN a Button has `size="lg"`, THE Button SHALL have height `h-10` (40px).

---

### Requirement 3: Button Shape Variants

**User Story:** As a developer, I want a Button component with shape variants, so that I can create icon-only buttons with appropriate padding.

#### Acceptance Criteria

1. THE Button SHALL accept a `shape` prop with variants: `default`, `square`, `circle`.
2. WHEN a Button has `shape="square"`, THE Button SHALL override horizontal padding to `px-0` and maintain equal width and height.
3. WHEN a Button has `shape="circle"`, THE Button SHALL override horizontal padding to `px-0`, maintain equal width and height, and apply `rounded-full`.

---

### Requirement 4: Radix Slot Integration

**User Story:** As a developer, I want the Button to support the `asChild` pattern, so that I can render it as any element (e.g., a Next.js Link) while preserving button styles.

#### Acceptance Criteria

1. THE Button SHALL be implemented using `@radix-ui/react-slot` `Slot` primitive.
2. WHEN a Button has `asChild={true}`, THE Button SHALL render as its child element instead of a `<button>`.
3. WHEN a Button has `asChild={true}`, THE Button SHALL merge its props with the child element's props.

---

### Requirement 5: Focus Ring

**User Story:** As a user, I want visible focus indicators on buttons when navigating with a keyboard, so that I can see which element has focus.

#### Acceptance Criteria

1. WHEN a Button is focused via keyboard, THE Button SHALL display a visible focus ring using the `fluent-focus-ring` utility class.
2. THE focus ring SHALL use Fluent Design System token colors.

---

### Requirement 6: Loading State

**User Story:** As a developer, I want the Button to support a loading state, so that I can indicate async operations are in progress.

#### Acceptance Criteria

1. THE Button SHALL accept an `isLoading?: boolean` prop.
2. WHEN a Button has `isLoading={true}`, THE Button SHALL render the Spinner component alongside its label.
3. WHEN a Button has `isLoading={true}`, THE Button SHALL set the `disabled` attribute.
4. WHEN a Button has `isLoading={true}` and `size="sm"`, THE Spinner SHALL have `size="3xs"`.
5. WHEN a Button has `isLoading={true}` and `size="default"`, THE Spinner SHALL have `size="2xs"`.
6. WHEN a Button has `isLoading={true}` and `size="lg"`, THE Spinner SHALL have `size="sm"`.
7. WHEN a Button has `isLoading={true}` and `appearance="primary"`, THE Spinner SHALL have `appearance="inverted"`.
8. WHEN a Button has `isLoading={true}` and `appearance` is not `"primary"`, THE Spinner SHALL have `appearance="primary"`.

---

### Requirement 7: Disabled State

**User Story:** As a developer, I want the Button to support a disabled state, so that I can prevent user interaction when appropriate.

#### Acceptance Criteria

1. THE Button SHALL accept a `disabled?: boolean` prop (inherited from `React.ButtonHTMLAttributes`).
2. WHEN a Button has `disabled={true}` or `isLoading={true}`, THE Button SHALL apply `opacity-50 cursor-not-allowed pointer-events-none` styles.
3. WHEN a Button has `disabled={true}` or `isLoading={true}`, THE Button SHALL set the `disabled` attribute on the underlying element.

---

### Requirement 8: TypeScript Types

**User Story:** As a developer, I want the Button component to be fully typed, so that I get autocomplete and type safety.

#### Acceptance Criteria

1. THE Button SHALL export a `ButtonProps` interface.
2. THE `ButtonProps` interface SHALL extend `React.ButtonHTMLAttributes<HTMLButtonElement>`.
3. THE `ButtonProps` interface SHALL extend `VariantProps<typeof buttonVariants>` from `tailwind-variants`.
4. THE `ButtonProps` interface SHALL include `appearance`, `size`, `shape`, `isLoading`, and `asChild` props.

---

### Requirement 9: Developer Showcase Page

**User Story:** As a developer, I want a dedicated showcase page for the Button component at `/components/button`, so that I can view all Button variants and states in one place.

#### Acceptance Criteria

1. THE Button showcase page SHALL be accessible at `/components/button`.
2. THE Button showcase page SHALL render all Button `appearance` variants: `default`, `primary`, `success`, `danger`, `warning`, `outline`, `subtle`, `transparent`, `link`.
3. THE Button showcase page SHALL render all Button `size` variants: `sm`, `default`, `lg`.
4. THE Button showcase page SHALL render Button `shape` variants: `square`, `circle`.
5. THE Button showcase page SHALL render Button in loading state (`isLoading={true}`).
6. THE Button showcase page SHALL render Button in disabled state (`disabled={true}`).
7. THE Button showcase page SHALL render Button with `asChild` pattern.
8. THE Button showcase page SHALL organize variants in a clear, scannable layout with labels.

---

## Correctness Properties

### Property 1: Button loading state implies disabled and Spinner

For any combination of Button `appearance`, `size`, and `shape` props, when `isLoading={true}`, the rendered button element SHALL have the `disabled` attribute set AND SHALL contain a `[data-spinner]` element in its subtree.

**Validates: Requirement 6**

### Property 2: Disabled Button always sets the disabled attribute

For any Button rendered with `disabled={true}` or `isLoading={true}`, the underlying `<button>` DOM element SHALL have the `disabled` attribute present, regardless of `appearance`, `size`, or `shape` variant.

**Validates: Requirement 7**
