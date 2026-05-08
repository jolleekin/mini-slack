# Requirements Document

## Introduction

This specification defines the refactoring of the design system CSS architecture in `apps/web/app/globals.css`. The current 500+ line monolithic file will be split into modular, maintainable files co-located with React components in `apps/web/components/ui/`. A single entrypoint (`components/ui/index.css`) will provide access to the entire design system.

Additionally, Fluent Design System motion tokens (duration and easing curves) and shadow tokens (elevation shadows) will be added to support animated UI components and elevated surfaces.

The refactoring maintains backward compatibility—all existing token references continue to work without changes to consuming components. The co-located structure prepares for future extraction to a `packages/ui` shared package.

## Glossary

- **Design_System**: The collection of CSS custom properties (tokens) and component styles that define the visual language for the web application
- **Token**: A CSS custom property (e.g., `--color-accent-9`, `--duration-fast`) that stores a reusable design value
- **Motion_Token**: A CSS custom property defining animation duration or easing curve
- **Shadow_Token**: A CSS custom property defining box-shadow values for elevation and depth
- **Color_Token**: A CSS custom property defining a color value from the Radix color scales
- **Utility**: A reusable CSS class or pattern (e.g., `.fluent-focus-ring`)
- **Module**: A separate CSS file containing a specific category of tokens, utilities, or component styles
- **Entrypoint**: The single CSS file (`components/ui/index.css`) that imports all design system modules
- **Globals_File**: The main `apps/web/app/globals.css` file that imports the design system entrypoint
- **Radix_Scale**: A color scale from the Radix UI color system (e.g., purple, gray, green)
- **Semantic_Alias**: A token that maps to another token for semantic meaning (e.g., `--color-accent-9` → `--color-purple-9`)
- **Tailwind_Theme**: The `@theme inline` directive in Tailwind CSS v4 that defines design tokens
- **Component**: A React component that consumes design tokens (e.g., Button, Input, Spinner)
- **Co-location**: Organizing related files (components, styles, tests) in the same directory

## Requirements

### Requirement 1: Create Single Entrypoint for Design System

**User Story:** As a developer, I want a single import point for the entire design system, so that I can easily consume all design tokens and styles with one import statement.

#### Acceptance Criteria

1. THE Design_System SHALL provide a single entrypoint file at `apps/web/components/ui/index.css`
2. THE Entrypoint SHALL import all token modules, utility modules, and component style modules in the correct dependency order
3. THE Globals_File SHALL import only the Entrypoint (not individual modules)
4. WHEN a developer imports the Entrypoint, THE Design_System SHALL make all tokens, utilities, and component styles available
5. THE Entrypoint SHALL be under 20 lines (import statements only, no style definitions)

### Requirement 2: Co-locate Design System with Components

**User Story:** As a developer, I want the design system files co-located with React components, so that I can easily find and maintain related code together.

#### Acceptance Criteria

1. THE Design_System SHALL organize all files within `apps/web/components/ui/` directory
2. THE Design_System SHALL place token modules in `apps/web/components/ui/styles/tokens/` subdirectory
3. THE Design_System SHALL place utility modules in `apps/web/components/ui/styles/` subdirectory
4. THE Design_System SHALL place component-specific styles in their respective component folders (e.g., `components/ui/spinner/spinner.css`)
5. WHEN a developer navigates to `components/ui/`, THE Design_System SHALL provide access to all components, styles, and tests in one location

### Requirement 3: Simplify App Entry Point

**User Story:** As a developer, I want the app's `globals.css` to be minimal, so that I can clearly distinguish between design system styles and app-specific styles.

#### Acceptance Criteria

1. THE Globals_File SHALL import Tailwind CSS first
2. THE Globals_File SHALL import the Design_System Entrypoint second
3. THE Globals_File SHALL define only app-specific styles (font tokens) after imports
4. THE Globals_File SHALL be under 15 lines total
5. THE Globals_File SHALL use the correct relative path to import the Entrypoint (`../components/ui/index.css`)

### Requirement 4: Split Globals File into Modular Structure

**User Story:** As a developer, I want the design system CSS organized into separate files by category, so that I can quickly find and maintain specific token types.

#### Acceptance Criteria

1. THE Design_System SHALL consist of separate Module files for colors, motion, utilities, and component styles
2. THE Entrypoint SHALL import all Module files in the correct dependency order
3. WHEN a developer needs to modify color tokens, THE Design_System SHALL provide a dedicated colors module file at `components/ui/styles/tokens/colors.css`
4. WHEN a developer needs to modify motion tokens, THE Design_System SHALL provide a dedicated motion module file at `components/ui/styles/tokens/motion.css`
5. FOR ALL existing Component references to tokens, the refactoring SHALL preserve backward compatibility (no Component changes required)

### Requirement 5: Create Color Tokens Module

**User Story:** As a developer, I want all color-related tokens in a dedicated file, so that I can manage the color system independently.

#### Acceptance Criteria

1. THE Design_System SHALL provide a color tokens module at `apps/web/components/ui/styles/tokens/colors.css`
2. THE Color_Tokens_Module SHALL import all Radix_Scale CSS files (purple, gray, green, red, orange, white-alpha, black-alpha)
3. THE Color_Tokens_Module SHALL define mappings from Radix_Scale variables to Design_System Color_Token custom properties
4. THE Color_Tokens_Module SHALL define Semantic_Alias tokens (accent, success, danger, warning)
5. THE Color_Tokens_Module SHALL define contrast color tokens
6. WHEN the Entrypoint imports the color tokens module, THE Design_System SHALL make all Color_Token custom properties available to Components

### Requirement 6: Create Motion Tokens Module

**User Story:** As a developer, I want motion tokens (durations and easing curves) available as CSS custom properties, so that I can create consistent animations across the application.

#### Acceptance Criteria

1. THE Design_System SHALL provide a motion tokens module at `apps/web/components/ui/styles/tokens/motion.css`
2. THE Motion_Tokens_Module SHALL define eight duration tokens: `--duration-ultra-fast` (50ms), `--duration-faster` (100ms), `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-gentle` (250ms), `--duration-slow` (300ms), `--duration-slower` (400ms), `--duration-ultra-slow` (500ms)
3. THE Motion_Tokens_Module SHALL define nine easing curve tokens: `--curve-accelerate-max`, `--curve-accelerate-mid`, `--curve-accelerate-min`, `--curve-decelerate-max`, `--curve-decelerate-mid`, `--curve-decelerate-min`, `--curve-easy-ease-max`, `--curve-easy-ease`, `--curve-linear`
4. THE Motion_Tokens_Module SHALL define easing curves using cubic-bezier functions matching Fluent Design System specifications
5. WHEN a Component uses a Motion_Token in a CSS transition or animation, THE Design_System SHALL provide the correct duration or easing curve value
6. FOR ALL Motion_Token definitions, the module SHALL use the Tailwind_Theme `@theme inline` directive to make tokens available to Tailwind utilities

### Requirement 7: Create Shadow Tokens Module

**User Story:** As a developer, I want shadow tokens (elevation shadows) available as CSS custom properties, so that I can create consistent depth and elevation across the application.

#### Acceptance Criteria

1. THE Design_System SHALL provide a shadow tokens module at `apps/web/components/ui/styles/tokens/shadows.css`
2. THE Shadow_Tokens_Module SHALL define four shadow color tokens: `--color-neutral-shadow-ambient`, `--color-neutral-shadow-key`, `--color-brand-shadow-ambient`, `--color-brand-shadow-key`
3. THE Shadow_Tokens_Module SHALL define six neutral elevation shadow tokens: `--shadow-2`, `--shadow-4`, `--shadow-8`, `--shadow-16`, `--shadow-28`, `--shadow-64`
4. THE Shadow_Tokens_Module SHALL define six brand elevation shadow tokens: `--shadow-2-brand`, `--shadow-4-brand`, `--shadow-8-brand`, `--shadow-16-brand`, `--shadow-28-brand`, `--shadow-64-brand`
5. THE Shadow_Tokens_Module SHALL define shadows using box-shadow CSS with ambient and key light components matching Fluent Design System specifications
6. WHEN a Component uses a Shadow_Token in a box-shadow property, THE Design_System SHALL provide the correct shadow value
7. FOR ALL Shadow_Token definitions, the module SHALL use the Tailwind_Theme `@theme inline` directive to make tokens available to Tailwind utilities

### Requirement 8: Create Utilities Module

**User Story:** As a developer, I want reusable CSS utilities in a dedicated file, so that I can maintain shared patterns separately from tokens.

#### Acceptance Criteria

1. THE Design_System SHALL provide a utilities module at `apps/web/components/ui/styles/utilities.css`
2. THE Utilities_Module SHALL define the `.fluent-focus-ring` utility class
3. THE Utilities_Module SHALL define stroke width tokens (`--stroke-width-thin`, `--stroke-width-thick`, `--stroke-width-thicker`, `--stroke-width-thickest`)
4. WHEN a Component applies the `.fluent-focus-ring` utility, THE Design_System SHALL render a 2px accent-colored outline with 2px offset on focus-visible state

### Requirement 9: Co-locate Component Styles

**User Story:** As a developer, I want component-specific styles in the same folder as the component code, so that I can maintain component styles alongside component logic.

#### Acceptance Criteria

1. THE Design_System SHALL provide component-specific style files co-located with their React components
2. THE Spinner_Component SHALL have its styles at `apps/web/components/ui/spinner/spinner.css`
3. THE Input_Component SHALL have its styles at `apps/web/components/ui/input/input.css`
4. THE Spinner_Styles SHALL define all spinner-related keyframe animations (`spinner-rotate`, `spinner-tail`, `spinner-tail-before`, `spinner-tail-after`)
5. THE Spinner_Styles SHALL define spinner-specific CSS classes (`.spinner-tail`)
6. THE Spinner_Styles SHALL include the `prefers-reduced-motion` media query handling
7. WHEN the Spinner Component renders, THE Design_System SHALL provide all necessary animation styles
8. WHEN the Input Component renders, THE Design_System SHALL provide focus indicator animation styles

### Requirement 10: Maintain Import Order Dependencies

**User Story:** As a developer, I want the CSS modules imported in the correct order, so that tokens are defined before utilities that reference them.

#### Acceptance Criteria

1. THE Entrypoint SHALL import token modules (colors, motion, shadows) before utility modules
2. THE Entrypoint SHALL import utility modules before component style modules
3. THE Globals_File SHALL import Tailwind CSS before the Design_System Entrypoint
4. WHEN the browser loads the Globals_File, THE Design_System SHALL ensure all token dependencies are resolved before utilities that reference them

### Requirement 11: Preserve Tailwind CSS v4 Compatibility

**User Story:** As a developer, I want the modular CSS structure to work with Tailwind CSS v4, so that I can use design tokens in Tailwind utility classes.

#### Acceptance Criteria

1. THE Design_System SHALL use the `@theme inline` directive for all token definitions
2. WHEN a developer uses a Color_Token in a Tailwind class (e.g., `bg-accent-9`), THE Design_System SHALL provide the correct color value
3. WHEN a developer uses a Motion_Token in a Tailwind class (e.g., `duration-fast`), THE Design_System SHALL provide the correct duration value
4. FOR ALL token modules, the `@theme inline` directive SHALL wrap token definitions to ensure Tailwind integration

### Requirement 12: Maintain Backward Compatibility

**User Story:** As a developer, I want all existing component code to work without changes after the refactoring, so that I can adopt the new structure without breaking existing features.

#### Acceptance Criteria

1. FOR ALL existing Component references to Color_Token custom properties, THE Design_System SHALL provide the same token names and values
2. FOR ALL existing Component references to utility classes, THE Design_System SHALL provide the same class names and styles
3. FOR ALL existing Component references to animation classes, THE Design_System SHALL provide the same class names and keyframes
4. WHEN the refactoring is complete, THE Design_System SHALL pass all existing Component tests without modification
5. THE Design_System SHALL NOT require changes to any existing Component files

### Requirement 13: Support New Input Component Motion Requirements

**User Story:** As a developer, I want to use motion tokens in the new Input component, so that I can create an animated focus indicator with consistent timing.

#### Acceptance Criteria

1. WHEN the Input Component uses `--duration-normal` for a focus indicator animation, THE Design_System SHALL provide a 200ms duration
2. WHEN the Input Component uses `--curve-easy-ease` for a focus indicator animation, THE Design_System SHALL provide the cubic-bezier(0.33,0,0.67,1) easing curve
3. THE Motion_Tokens_Module SHALL make duration and easing tokens available before the Input Component is rendered

### Requirement 14: Organize Files in Co-located Directory Structure

**User Story:** As a developer, I want CSS modules co-located with React components, so that I can navigate the design system intuitively and prepare for future extraction to a shared package.

#### Acceptance Criteria

1. THE Design_System SHALL organize all files within `apps/web/components/ui/` directory
2. THE Design_System SHALL organize token modules in `apps/web/components/ui/styles/tokens/` subdirectory
3. THE Design_System SHALL place component-specific styles in their respective component folders (e.g., `components/ui/spinner/spinner.css`)
4. THE Design_System SHALL place the utilities module at `apps/web/components/ui/styles/utilities.css`
5. THE Design_System SHALL place the entrypoint at `apps/web/components/ui/index.css`
6. THE Globals_File SHALL remain at `apps/web/app/globals.css`
7. WHEN a developer explores the design system, THE directory structure SHALL clearly indicate co-location of components, styles, and tests
8. WHEN a developer needs to extract the design system to a shared package, THE co-located structure SHALL enable moving the entire `components/ui/` folder
