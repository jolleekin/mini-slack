# Requirements Document: Input Component

## Introduction

This feature delivers the `Input` UI component for MiniSlack. It provides a reusable, accessible text input primitive styled with Microsoft's Fluent Design System tokens via Tailwind CSS v4. The component supports error states, integrates with Radix UI Form primitives for validation, and uses React 19's native `ref` prop pattern (no `forwardRef` wrapper).

The Input component lives in `apps/web/components/ui/input.tsx` and is consumed by auth pages and all future form-based pages.

## Glossary

- **Input**: A styled text input component following Fluent Design tokens.
- **Fluent_Tokens**: The Radix UI color scale CSS variables (`--color-accent-*`, `--color-gray-*`, `--color-danger-*`) defined in `globals.css`.
- **Error State**: A visual state indicating validation failure or invalid input.

---

## Requirements

### Requirement 1: Basic Input Styling

**User Story:** As a developer, I want a reusable Input component with Fluent Design styling, so that all text inputs share a consistent appearance.

#### Acceptance Criteria

1. THE Input SHALL render a styled `<input>` element extending `React.InputHTMLAttributes<HTMLInputElement>`.
2. THE Input SHALL use `bg-gray-a2` for background color.
3. THE Input SHALL use `text-gray-12` for text color.
4. THE Input SHALL use `text-gray-a11` for placeholder color.
5. THE Input SHALL use `border-gray-a7` for normal border.
6. THE Input SHALL apply `rounded-md` for border radius.
7. THE Input SHALL apply appropriate padding (`px-3 py-2`).

---

### Requirement 2: Focus State

**User Story:** As a user, I want visible focus indicators on inputs when navigating with a keyboard, so that I can see which element has focus.

#### Acceptance Criteria

1. WHEN an Input is focused, THE Input SHALL use `border-accent-8` for border color.
2. WHEN an Input is focused, THE Input SHALL display a focus ring using the `fluent-focus-ring` utility class.
3. WHEN an Input is focused, THE Input SHALL display an animated horizontal line at the bottom that scales from 0 to 100% width.
4. THE animated focus indicator SHALL use Fluent Design System motion tokens:
   - Duration: `durationFast` (150ms)
   - Easing: `curveDecelerateMin`
5. THE animated focus indicator SHALL use `accent-8` color in normal state.
6. THE animated focus indicator SHALL use `danger-8` color in error state.
7. THE animated focus indicator SHALL be implemented using a `::after` pseudo-element positioned absolutely at the bottom.
8. THE animated focus indicator SHALL use CSS transform `scaleX()` for the animation (from `scaleX(0)` to `scaleX(1)`).

---

### Requirement 3: Error State

**User Story:** As a developer, I want the Input to support an error state, so that I can indicate validation failures to users.

#### Acceptance Criteria

1. THE Input SHALL accept a `hasError?: boolean` prop.
2. WHEN an Input has `hasError={true}`, THE Input SHALL use `border-danger-7` for border color.
3. WHEN an Input has `hasError={true}` and is focused, THE Input SHALL use `border-danger-8` for border color.
4. WHEN an Input has `hasError={true}`, THE focus ring SHALL use danger color tokens.

---

### Requirement 4: TypeScript Types and React 19 Ref Pattern

**User Story:** As a developer, I want the Input component to be fully typed and use React 19's native ref pattern, so that I get autocomplete, type safety, and a cleaner component API.

#### Acceptance Criteria

1. THE Input SHALL export an `InputProps` interface.
2. THE `InputProps` interface SHALL extend `React.InputHTMLAttributes<HTMLInputElement>`.
3. THE `InputProps` interface SHALL include a `hasError?: boolean` prop.
4. THE `InputProps` interface SHALL include a `ref?: React.Ref<HTMLInputElement>` prop.
5. THE Input component SHALL NOT use `React.forwardRef` (React 19+ pattern).
6. THE Input component SHALL accept `ref` as a regular prop and forward it to the underlying `<input>` element.

---

### Requirement 5: Radix Form Integration

**User Story:** As a developer, I want the Input component to work seamlessly with Radix UI Form primitives, so that I can build forms with built-in validation and accessibility.

#### Acceptance Criteria

1. THE Input SHALL work as a child of `Form.Control` using the `asChild` pattern.
2. THE Input SHALL support native HTML validation attributes (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, etc.).
3. THE Input SHALL apply danger border styling when the `data-invalid` attribute is present (set by Radix Form).
4. THE Input SHALL be compatible with `Form.Message` for displaying validation errors.
5. THE Input SHALL be compatible with `Form.ValidityState` for custom validation UI.
6. THE Input SHALL support both manual error control (`hasError` prop) and Radix Form automatic validation (`data-invalid` attribute) simultaneously.

---

### Requirement 6: Developer Showcase Page

**User Story:** As a developer, I want a dedicated showcase page for the Input component at `/components/input`, so that I can view all Input variants and integration patterns once implemented.

#### Acceptance Criteria

1. THE Input showcase page SHALL be accessible at `/components/input`.
2. THE Input showcase page SHALL render Input in normal state.
3. THE Input showcase page SHALL render Input in error state (`hasError={true}`).
4. THE Input showcase page SHALL render Input in disabled state (`disabled={true}`).
5. THE Input showcase page SHALL render Input with placeholder text.
6. THE Input showcase page SHALL demonstrate Radix Form integration with validation.
7. THE Input showcase page SHALL organize variants in a clear, scannable layout with labels.
8. IF the Input component is not yet implemented, THE showcase page SHALL display a placeholder message.
