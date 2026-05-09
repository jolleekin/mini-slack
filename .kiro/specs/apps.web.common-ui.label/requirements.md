# Requirements Document: Label Component

## Introduction

This feature delivers the `Label` UI component for MiniSlack. It provides a reusable, accessible label primitive styled with Microsoft's Fluent Design System tokens via Tailwind CSS v4. The component is designed to be paired with form inputs like the Input component.

The Label component lives in `apps/web/components/ui/label.tsx` and is consumed by auth pages and all future form-based pages.

## Glossary

- **Label**: An accessible label component paired with form inputs.
- **Fluent_Tokens**: The Radix UI color scale CSS variables (`--color-gray-*`) defined in `globals.css`.
- **Required_Indicator**: The visual marker (default: red asterisk `*`) appended after label text to signal a required field.
- **Label_Variants**: The `tailwind-variants` (`tv`) configuration object that drives size and disabled styling for the Label component.

---

## Requirements

### Requirement 1: Basic Label Styling

**User Story:** As a developer, I want a reusable Label component, so that form inputs are consistently and accessibly labelled.

#### Acceptance Criteria

1. THE Label SHALL render a styled `<label>` element extending `React.LabelHTMLAttributes<HTMLLabelElement>`.
2. THE Label SHALL apply `text-gray-12` for text color.
3. THE Label SHALL apply `text-sm` as the default font size.
4. THE Label SHALL apply `font-medium` for font weight.
5. THE Label SHALL pass `htmlFor` through to the underlying `<label>` element.

---

### Requirement 2: TypeScript Types

**User Story:** As a developer, I want the Label component to be fully typed, so that I get autocomplete and type safety.

#### Acceptance Criteria

1. THE Label SHALL export a `LabelProps` interface.
2. THE `LabelProps` interface SHALL extend `React.LabelHTMLAttributes<HTMLLabelElement>`.
3. THE `LabelProps` interface SHALL include a `required` prop typed as `boolean | string | JSX.Element | undefined`.
4. THE `LabelProps` interface SHALL include a `disabled` prop typed as `boolean | undefined`.
5. THE `LabelProps` interface SHALL include a `size` prop typed as `"sm" | "default" | "lg" | undefined`.

---

### Requirement 3: Required Field Indicator

**User Story:** As a developer, I want to mark a label as required, so that users can see which form fields are mandatory.

#### Acceptance Criteria

1. WHEN the `required` prop is `true`, THE Label SHALL render a red asterisk (`*`) after the label text.
2. WHEN the `required` prop is a non-empty string, THE Label SHALL render that string after the label text instead of the default asterisk.
3. WHEN the `required` prop is a JSX element, THE Label SHALL render that element after the label text instead of the default asterisk.
4. THE Required_Indicator SHALL use `text-danger-9` (or equivalent red Fluent token) for its text color when rendered as the default asterisk.
5. WHEN the `required` prop is `false` or `undefined`, THE Label SHALL render no Required_Indicator.

---

### Requirement 4: Disabled State

**User Story:** As a developer, I want to mark a label as disabled, so that it visually matches a disabled form input it is paired with.

#### Acceptance Criteria

1. WHEN the `disabled` prop is `true`, THE Label SHALL apply `opacity-50` to appear visually muted.
2. WHEN the `disabled` prop is `true`, THE Label SHALL apply `cursor-not-allowed` to signal the non-interactive state.
3. WHEN the `disabled` prop is `false` or `undefined`, THE Label SHALL render with full opacity and default cursor.

---

### Requirement 5: Size Variants

**User Story:** As a developer, I want size variants on the Label component, so that label text scales consistently alongside form inputs of different sizes.

#### Acceptance Criteria

1. THE Label SHALL implement size variants using `tailwind-variants` (`tv`), following the same pattern as the Button component.
2. WHEN the `size` prop is `"sm"`, THE Label SHALL apply `text-xs`.
3. WHEN the `size` prop is `"default"` or the `size` prop is omitted, THE Label SHALL apply `text-sm`.
4. WHEN the `size` prop is `"lg"`, THE Label SHALL apply `text-base`.
5. THE Label_Variants configuration SHALL define `"default"` as the default value for the `size` variant.

---

### Requirement 6: Developer Showcase Page

**User Story:** As a developer, I want a dedicated showcase page for the Label component at `/components/label`, so that I can view Label examples once implemented.

#### Acceptance Criteria

1. THE Label showcase page SHALL be accessible at `/components/label`.
2. THE Label showcase page SHALL render a standalone Label component.
3. THE Label showcase page SHALL render a Label paired with an Input using `htmlFor`.
4. THE Label showcase page SHALL render examples of the `required` prop: one with `required={true}` (default asterisk), one with a custom string, and one with a custom JSX element.
5. THE Label showcase page SHALL render examples of the `disabled` prop: one with `disabled={true}` paired with a disabled input.
6. THE Label showcase page SHALL render examples of all three `size` variants (`"sm"`, `"default"`, `"lg"`).
7. THE Label showcase page SHALL organize examples in a clear, scannable layout with descriptions.
8. IF the Label component is not yet implemented, THE showcase page SHALL display a placeholder message.
