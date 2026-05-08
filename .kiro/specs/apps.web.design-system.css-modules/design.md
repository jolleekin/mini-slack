# Design Document: CSS Modules Refactoring

## Overview

This design refactors the monolithic `apps/web/app/globals.css` file (500+ lines) into a modular, maintainable CSS architecture co-located with React components. The refactoring moves all design system files into `apps/web/components/ui/` and creates a single entrypoint for the entire design system.

The modular structure splits the file into:

- **Token modules** (colors, motion, shadows) — design system primitives
- **Utilities module** — reusable CSS patterns
- **Component modules** — component-specific styles (spinner, input)

The co-located structure improves maintainability, enables easier navigation, and prepares for future extraction to a `packages/ui` shared package. It adds Fluent Design System motion tokens (8 durations + 9 easing curves) and shadow tokens (12 elevation shadows) to support animated UI components like the Input focus indicator and elevated surfaces.

**Key Design Principles:**
1. **Feature-first co-location** — components, styles, and tests live together
2. **Single entrypoint** — one import for the entire design system
3. **Backward compatibility** — all existing token references continue to work without component changes
4. **Dependency ordering** — tokens defined before utilities that reference them
5. **Tailwind CSS v4 integration** — `@theme inline` directive makes tokens available to Tailwind utilities
6. **Easy extraction** — structure enables moving `components/ui/` to `packages/ui` later

## Architecture

### Directory Structure

```
apps/web/
├── components/ui/
│   ├── index.css                        # 🎯 DESIGN SYSTEM ENTRYPOINT
│   ├── styles/
│   │   ├── tokens/
│   │   │   ├── colors.css               # Color system (Radix scales + semantic aliases)
│   │   │   ├── motion.css               # Motion tokens (durations + easing curves)
│   │   │   └── shadows.css              # Shadow tokens (elevation shadows)
│   │   └── utilities.css                # Reusable CSS utilities (.fluent-focus-ring, stroke widths)
│   ├── button/
│   │   ├── button.tsx                   # Button component
│   │   └── button.test.tsx              # Button tests
│   ├── input/
│   │   ├── input.tsx                    # Input component
│   │   ├── input.test.tsx               # Input tests
│   │   └── input.css                    # Input-specific styles (focus indicator)
│   └── spinner/
│       ├── spinner.tsx                  # Spinner component
│       ├── spinner.test.tsx             # Spinner tests
│       └── spinner.css                  # Spinner animations and styles
└── app/
    └── globals.css                      # App entry point (imports design system)
```

### Import Order (Critical)

The `components/ui/index.css` entrypoint imports modules in this order to ensure dependency resolution:

```css
@import "./styles/tokens/colors.css";    /* 1. Color tokens */
@import "./styles/tokens/motion.css";    /* 2. Motion tokens */
@import "./styles/tokens/shadows.css";   /* 3. Shadow tokens */
@import "./styles/utilities.css";        /* 4. Utilities (depend on tokens) */
@import "./spinner/spinner.css";         /* 5. Component styles */
@import "./input/input.css";             /* 6. Component styles */
```

The `app/globals.css` file becomes minimal:

```css
@import "tailwindcss";                   /* 1. Tailwind base */
@import "../components/ui/index.css";    /* 2. Design system entrypoint */

/* App-specific styles below */
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Rationale**: 
- Tokens must be defined before utilities that reference them (e.g., `.fluent-focus-ring` uses `--color-accent-8`)
- Component styles can reference tokens and utilities
- Single import point simplifies consumption and enables easy extraction to a shared package
- Clear boundary between design system (in `components/ui/`) and app-specific styles (in `globals.css`)

## Components and Interfaces

### 1. Design System Entrypoint: `components/ui/index.css`

**Purpose**: Single import point for the entire design system

**Content**:
```css
/* CRITICAL: Import order must be maintained for token dependencies */

/* Token modules */
@import "./styles/tokens/colors.css";
@import "./styles/tokens/motion.css";
@import "./styles/tokens/shadows.css";

/* Utilities */
@import "./styles/utilities.css";

/* Component styles */
@import "./spinner/spinner.css";
@import "./input/input.css";
```

**Lines**: ~14

**Usage**: Import once in `app/globals.css`:
```css
@import "../components/ui/index.css";
```

### 2. App Entry Point: `app/globals.css`

**Purpose**: Import design system and define app-specific styles

**Content**:
```css
@import "tailwindcss";
@import "../components/ui/index.css";  /* Design system entrypoint */

/* App-specific styles below */
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Lines**: ~10 (down from 500+)

**Benefits**:
- Clear separation between design system and app-specific styles
- Single import point for entire design system
- Easy to extract `components/ui/` to `packages/ui` later

### 3. Color Tokens Module: `components/ui/styles/tokens/colors.css`

**Purpose**: Centralize all color-related tokens

**Structure**:
1. Import Radix color scale CSS files (purple, gray, green, red, orange, white-alpha, black-alpha)
2. Map Radix variables to design system tokens within `@theme inline`
3. Define semantic aliases (accent → purple, success → green, etc.)
4. Define contrast colors

**Content Outline**:
```css
/* Radix color scale imports */
@import "@radix-ui/colors/purple.css";
@import "@radix-ui/colors/purple-alpha.css";
/* ... (all scales: purple, gray, green, red, orange, white-alpha, black-alpha) */

@theme inline {
  /* Purple scale (1-12 + alpha) */
  --color-purple-1: var(--purple-1);
  /* ... */
  
  /* Gray scale (1-12 + alpha) */
  --color-gray-1: var(--gray-1); /* Page background */
  /* ... */
  
  /* Green, Red, Orange scales */
  /* ... */
  
  /* Overlay scales (white-alpha, black-alpha) */
  /* ... */
  
  /* Semantic aliases */
  --color-accent-1: var(--purple-1);
  --color-accent-9: var(--purple-9); /* solid fill */
  /* ... (accent, success, danger, warning) */
  
  /* Contrast colors */
  --color-accent-contrast: white;
  --color-success-contrast: white;
  --color-danger-contrast: white;
  --color-warning-contrast: white;
}
```

**Lines**: ~250 (extracted from globals.css)

**Tailwind Integration**: All color tokens are available as Tailwind utilities (e.g., `bg-accent-9`, `text-gray-12`)

### 4. Motion Tokens Module: `components/ui/styles/tokens/motion.css`

**Purpose**: Define animation durations and easing curves following Fluent Design System specifications

**Duration Tokens** (8 total):
| Token | Value | Use Case |
|-------|-------|----------|
| `--duration-ultra-fast` | 50ms | Micro-interactions (hover feedback) |
| `--duration-faster` | 100ms | Quick transitions (tooltip show/hide) |
| `--duration-fast` | 150ms | Standard hover states |
| `--duration-normal` | 200ms | Default transitions (focus indicators) |
| `--duration-gentle` | 250ms | Smooth state changes |
| `--duration-slow` | 300ms | Deliberate animations |
| `--duration-slower` | 400ms | Emphasized transitions |
| `--duration-ultra-slow` | 500ms | Dramatic effects |

**Easing Curve Tokens** (9 total):
| Token | Cubic Bezier | Behavior |
|-------|--------------|----------|
| `--curve-accelerate-max` | `cubic-bezier(1,0,1,1)` | Fastest acceleration |
| `--curve-accelerate-mid` | `cubic-bezier(0.7,0,1,0.5)` | Medium acceleration |
| `--curve-accelerate-min` | `cubic-bezier(0.8,0,1,1)` | Gentle acceleration |
| `--curve-decelerate-max` | `cubic-bezier(0,0,0,1)` | Fastest deceleration |
| `--curve-decelerate-mid` | `cubic-bezier(0,0.5,0,1)` | Medium deceleration |
| `--curve-decelerate-min` | `cubic-bezier(0,0,0.2,1)` | Gentle deceleration |
| `--curve-easy-ease-max` | `cubic-bezier(0.8,0,0.2,1)` | Strong ease-in-out |
| `--curve-easy-ease` | `cubic-bezier(0.33,0,0.67,1)` | Balanced ease-in-out |
| `--curve-linear` | `linear` | No easing |

**Content**:
```css
@theme inline {
  /* Duration tokens */
  --duration-ultra-fast: 50ms;
  --duration-faster: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-gentle: 250ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;
  --duration-ultra-slow: 500ms;

  /* Easing curve tokens */
  --curve-accelerate-max: cubic-bezier(1, 0, 1, 1);
  --curve-accelerate-mid: cubic-bezier(0.7, 0, 1, 0.5);
  --curve-accelerate-min: cubic-bezier(0.8, 0, 1, 1);
  --curve-decelerate-max: cubic-bezier(0, 0, 0, 1);
  --curve-decelerate-mid: cubic-bezier(0, 0.5, 0, 1);
  --curve-decelerate-min: cubic-bezier(0, 0, 0.2, 1);
  --curve-easy-ease-max: cubic-bezier(0.8, 0, 0.2, 1);
  --curve-easy-ease: cubic-bezier(0.33, 0, 0.67, 1);
  --curve-linear: linear;
}
```

**Lines**: ~25

**Usage Example** (Input component focus indicator):
```css
.input {
  transition: border-color var(--duration-normal) var(--curve-easy-ease);
}
```

**Tailwind Integration**: Motion tokens are available as Tailwind utilities (e.g., `duration-normal`, `ease-[var(--curve-easy-ease)]`)

### 5. Shadow Tokens Module: `components/ui/styles/tokens/shadows.css`

**Purpose**: Define elevation shadows following Fluent Design System specifications

**Shadow Color Tokens** (4 total):
| Token | Purpose |
|-------|---------|
| `--color-neutral-shadow-ambient` | Ambient shadow for neutral surfaces |
| `--color-neutral-shadow-key` | Key light shadow for neutral surfaces |
| `--color-brand-shadow-ambient` | Ambient shadow for brand-colored surfaces |
| `--color-brand-shadow-key` | Key light shadow for brand-colored surfaces |

**Neutral Elevation Shadows** (6 levels):
| Token | Elevation | Use Case |
|-------|-----------|----------|
| `--shadow-2` | 2dp | Subtle elevation (cards, buttons) |
| `--shadow-4` | 4dp | Low elevation (raised cards) |
| `--shadow-8` | 8dp | Medium elevation (dropdowns, popovers) |
| `--shadow-16` | 16dp | High elevation (modals, dialogs) |
| `--shadow-28` | 28dp | Very high elevation (tooltips) |
| `--shadow-64` | 64dp | Maximum elevation (full-screen overlays) |

**Brand Elevation Shadows** (6 levels):
| Token | Elevation | Use Case |
|-------|-----------|----------|
| `--shadow-2-brand` | 2dp | Subtle brand elevation |
| `--shadow-4-brand` | 4dp | Low brand elevation |
| `--shadow-8-brand` | 8dp | Medium brand elevation (primary buttons) |
| `--shadow-16-brand` | 16dp | High brand elevation |
| `--shadow-28-brand` | 28dp | Very high brand elevation |
| `--shadow-64-brand` | 64dp | Maximum brand elevation |

**Content**:
```css
@theme inline {
  /* Shadow color tokens */
  --color-neutral-shadow-ambient: rgba(0, 0, 0, 0.12);
  --color-neutral-shadow-key: rgba(0, 0, 0, 0.14);
  --color-brand-shadow-ambient: rgba(115, 70, 255, 0.12);
  --color-brand-shadow-key: rgba(115, 70, 255, 0.14);

  /* Neutral elevation shadows */
  --shadow-2: 0 1px 2px var(--color-neutral-shadow-ambient), 0 0 2px var(--color-neutral-shadow-key);
  --shadow-4: 0 2px 4px var(--color-neutral-shadow-ambient), 0 0 2px var(--color-neutral-shadow-key);
  --shadow-8: 0 4px 8px var(--color-neutral-shadow-ambient), 0 0 2px var(--color-neutral-shadow-key);
  --shadow-16: 0 8px 16px var(--color-neutral-shadow-ambient), 0 0 2px var(--color-neutral-shadow-key);
  --shadow-28: 0 14px 28px var(--color-neutral-shadow-ambient), 0 0 8px var(--color-neutral-shadow-key);
  --shadow-64: 0 32px 64px var(--color-neutral-shadow-ambient), 0 0 8px var(--color-neutral-shadow-key);

  /* Brand elevation shadows */
  --shadow-2-brand: 0 1px 2px var(--color-brand-shadow-ambient), 0 0 2px var(--color-brand-shadow-key);
  --shadow-4-brand: 0 2px 4px var(--color-brand-shadow-ambient), 0 0 2px var(--color-brand-shadow-key);
  --shadow-8-brand: 0 4px 8px var(--color-brand-shadow-ambient), 0 0 2px var(--color-brand-shadow-key);
  --shadow-16-brand: 0 8px 16px var(--color-brand-shadow-ambient), 0 0 2px var(--color-brand-shadow-key);
  --shadow-28-brand: 0 14px 28px var(--color-brand-shadow-ambient), 0 0 8px var(--color-brand-shadow-key);
  --shadow-64-brand: 0 32px 64px var(--color-brand-shadow-ambient), 0 0 8px var(--color-brand-shadow-key);
}
```

**Lines**: ~25

**Usage Example** (Card component with elevation):
```css
.card {
  box-shadow: var(--shadow-4);
}

.card-brand {
  box-shadow: var(--shadow-8-brand);
}
```

**Tailwind Integration**: Shadow tokens are available as Tailwind utilities (e.g., `shadow-[var(--shadow-4)]`, `shadow-[var(--shadow-8-brand)]`)

### 6. Utilities Module: `components/ui/styles/utilities.css`

**Purpose**: Reusable CSS patterns and stroke width tokens

**Content**:
```css
@theme inline {
  /* Stroke width tokens */
  --stroke-width-thin: 1px;
  --stroke-width-thick: 2px;
  --stroke-width-thicker: 3px;
  --stroke-width-thickest: 4px;
}

/* Fluent focus ring utility */
@utility fluent-focus-ring {
  outline: none;
  &:focus-visible {
    outline: 2px solid var(--color-accent-8);
    outline-offset: 2px;
  }
}
```

**Lines**: ~20

**Usage**: Apply `.fluent-focus-ring` class to interactive elements (buttons, inputs) for consistent focus styling

### 7. Spinner Component Module: `components/ui/spinner/spinner.css`

**Purpose**: Spinner-specific animations and styles (co-located with component)

**Content**:
```css
/* Keyframe animations */
@keyframes spinner-rotate {
  to { transform: rotate(360deg); }
}

@keyframes spinner-tail {
  0%   { transform: rotate(-135deg); }
  50%  { transform: rotate(0deg); }
  100% { transform: rotate(225deg); }
}

@keyframes spinner-tail-before {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(105deg); }
  100% { transform: rotate(0deg); }
}

@keyframes spinner-tail-after {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(225deg); }
  100% { transform: rotate(0deg); }
}

/* Spinner tail class */
.spinner-tail {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  -webkit-mask-image: conic-gradient(transparent 105deg, white 105deg);
  mask-image: conic-gradient(transparent 105deg, white 105deg);
  animation: spinner-tail 1.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.spinner-tail::before,
.spinner-tail::after {
  content: "";
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  background-image: conic-gradient(currentColor 135deg, transparent 135deg);
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

.spinner-tail::before {
  animation-name: spinner-tail-before;
}

.spinner-tail::after {
  animation-name: spinner-tail-after;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation-duration: 3s;
  }
  .spinner-tail {
    animation-iteration-count: 0;
    -webkit-mask-image: none;
    mask-image: none;
    background-image: conic-gradient(transparent 120deg, currentColor 360deg);
  }
  .spinner-tail::before,
  .spinner-tail::after {
    content: none;
  }
}
```

**Lines**: ~70 (extracted from globals.css)

**Co-location Benefits**:
- Component styles live next to component code
- Easy to find and maintain component-specific styles
- Clear ownership and responsibility
- Enables extraction to `packages/ui` as a complete unit

### 8. Input Component Module: `components/ui/input/input.css`

**Purpose**: Input-specific styles (focus indicator animation)

**Content**:
```css
/* Input focus indicator animation */
.input {
  transition: border-color var(--duration-normal) var(--curve-easy-ease);
}

.input:focus-visible {
  border-color: var(--color-accent-8);
}
```

**Lines**: ~10

**Co-location Benefits**:
- Input styles live next to Input component
- Uses motion tokens for consistent animation timing
- Easy to modify input-specific behavior without affecting other components

## Data Models

### Token Naming Conventions

**Color Tokens**:
- Format: `--color-{scale}-{step}` or `--color-{scale}-a{step}`
- Examples: `--color-purple-9`, `--color-gray-a3`, `--color-accent-11`
- Semantic aliases: `--color-accent-*`, `--color-success-*`, `--color-danger-*`, `--color-warning-*`

**Motion Tokens**:
- Duration format: `--duration-{speed}`
- Easing format: `--curve-{type}-{intensity}` or `--curve-{type}`
- Examples: `--duration-normal`, `--curve-easy-ease`, `--curve-accelerate-max`

**Utility Tokens**:
- Stroke width format: `--stroke-width-{size}`
- Examples: `--stroke-width-thin`, `--stroke-width-thickest`

### File Size Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| `app/globals.css` | ~10 | App entry point + font tokens |
| `components/ui/index.css` | ~14 | Design system entrypoint |
| `components/ui/styles/tokens/colors.css` | ~250 | Color system |
| `components/ui/styles/tokens/motion.css` | ~25 | Motion tokens |
| `components/ui/styles/tokens/shadows.css` | ~25 | Shadow tokens |
| `components/ui/styles/utilities.css` | ~20 | Utilities + stroke widths |
| `components/ui/spinner/spinner.css` | ~70 | Spinner animations |
| `components/ui/input/input.css` | ~10 | Input focus indicator |
| **Total** | **~424** | (Down from 500+ in monolithic file) |

**Note**: Line count reduction comes from removing redundant comments and whitespace, not from removing functionality.

### Co-location Benefits

**Feature-First Organization**:
- Components, styles, and tests live together in the same folder
- Easy to understand component dependencies
- Clear ownership boundaries

**Extraction-Ready**:
- Moving `components/ui/` to `packages/ui` is straightforward
- All design system files are already grouped together
- Single entrypoint simplifies package exports

**Maintainability**:
- Component-specific styles are easy to find
- Changes to a component's styles don't require navigating to a separate directory
- Reduced cognitive load when working on a feature

## Error Handling

### Import Order Violations

**Problem**: If utilities are imported before tokens, CSS custom properties will be undefined.

**Solution**: Enforce import order in `components/ui/index.css` with comments:

```css
/* CRITICAL: Import order must be maintained for token dependencies */

/* Token modules */
@import "./styles/tokens/colors.css";    /* 1. Color tokens */
@import "./styles/tokens/motion.css";    /* 2. Motion tokens */

/* Utilities */
@import "./styles/utilities.css";        /* 3. Utilities (depend on tokens) */

/* Component styles */
@import "./spinner/spinner.css";         /* 4. Component styles */
@import "./input/input.css";             /* 5. Component styles */
```

### Missing Token References

**Problem**: Components reference tokens that don't exist after refactoring.

**Solution**: Maintain exact token names during migration. All existing tokens remain available:
- `--color-accent-9` → still defined in `components/ui/styles/tokens/colors.css`
- `--stroke-width-thick` → still defined in `components/ui/styles/utilities.css`
- `.fluent-focus-ring` → still defined in `components/ui/styles/utilities.css`
- `.spinner-tail` → still defined in `components/ui/spinner/spinner.css`

### Import Path Issues

**Problem**: Incorrect relative paths when importing the design system entrypoint.

**Solution**: Use correct relative path from `app/globals.css`:

```css
/* ✅ Correct */
@import "../components/ui/index.css";

/* ❌ Incorrect */
@import "../../components/ui/index.css";  /* Wrong: goes up too many levels */
@import "components/ui/index.css";        /* Wrong: not a relative path */
```

**Rationale**: `app/globals.css` is at `apps/web/app/globals.css`, and the entrypoint is at `apps/web/components/ui/index.css`. From `app/`, go up one level (`../`) to `apps/web/`, then into `components/ui/index.css`.

### Tailwind CSS v4 Integration Issues

**Problem**: Tokens not available to Tailwind utilities.

**Solution**: Wrap all token definitions in `@theme inline` directive:

```css
@theme inline {
  --color-accent-9: var(--purple-9);
  --duration-normal: 200ms;
  /* ... */
}
```

This makes tokens available to Tailwind's JIT compiler for utilities like `bg-accent-9` and `duration-normal`.

## Testing Strategy

### Testing Approach

Since this is a CSS architecture refactoring (Infrastructure as Code), property-based testing is not applicable. Instead, we use:

1. **Visual Regression Tests** — verify UI components render identically before/after refactoring
2. **Integration Tests** — verify existing component tests pass without modification
3. **Manual Testing** — verify design system showcase pages render correctly

### Test Categories

#### 1. Visual Regression Tests

**Tool**: Playwright or Chromatic (snapshot testing)

**Test Cases**:
- Button component (all variants: default, primary, success, danger, warning, outline, subtle, transparent, link)
- Spinner component (all sizes: 3xs-2xl, all appearances: primary, inverted)
- Input component with focus indicator animation (uses motion tokens)
- Landing page components (verify color tokens work in production)

**Success Criteria**: Pixel-perfect match between before/after screenshots

#### 2. Integration Tests

**Existing Test Suites**:
- `apps/web/components/ui/button.test.tsx` — unit tests for Button component
- `apps/web/components/ui/button.property.test.tsx` — property-based tests for Button
- `apps/web/components/ui/spinner.test.tsx` — unit tests for Spinner component
- `apps/web/app/(landing)/components/*.test.tsx` — landing page component tests

**Success Criteria**: All existing tests pass without modification (validates backward compatibility)

#### 3. Manual Testing Checklist

**Dev Pages** (`/components/*`):
- [ ] `/components/button` — all button variants render correctly
- [ ] `/components/spinner` — all spinner sizes/appearances animate correctly
- [ ] `/components/input` — focus indicator animates with correct duration/easing

**Landing Page** (`/`):
- [ ] Hero section colors match design
- [ ] CTA buttons use correct accent colors
- [ ] Footer links use correct hover states

**Focus Ring Utility**:
- [ ] Tab through interactive elements (buttons, inputs, links)
- [ ] Verify 2px purple outline with 2px offset on focus-visible

**Motion Tokens**:
- [ ] Input focus indicator animates smoothly (200ms, easy-ease curve)
- [ ] Button hover states transition correctly
- [ ] Spinner rotates at correct speed

**Import Verification**:
- [ ] Verify `app/globals.css` imports `../../components/ui/index.css` correctly
- [ ] Verify no CSS errors in browser console
- [ ] Verify all tokens are available (check computed styles in DevTools)

### Migration Validation

**Step-by-Step Validation**:
1. Run existing test suite before refactoring → baseline
2. Perform refactoring (create entrypoint, move files, update imports)
3. Run test suite again → must pass without changes
4. Run visual regression tests → must match baseline
5. Manual testing → verify no visual regressions

**Rollback Plan**: If tests fail, revert to monolithic `globals.css` from version control.

## Migration Strategy

### Phase 1: Create Directory Structure and Entrypoint

**Steps**:
1. Create directory structure:
   ```bash
   mkdir -p apps/web/components/ui/styles/tokens
   mkdir -p apps/web/components/ui/spinner
   mkdir -p apps/web/components/ui/input
   ```

2. Create design system entrypoint at `apps/web/components/ui/index.css`:
   ```css
   /* CRITICAL: Import order must be maintained for token dependencies */
   
   /* Token modules */
   @import "./styles/tokens/colors.css";
   @import "./styles/tokens/motion.css";
   
   /* Utilities */
   @import "./styles/utilities.css";
   
   /* Component styles */
   @import "./spinner/spinner.css";
   @import "./input/input.css";
   ```

### Phase 2: Create Token and Utility Modules

**Steps**:
1. Create `components/ui/styles/tokens/colors.css`:
   - Copy Radix imports from `app/globals.css`
   - Copy all color token definitions (purple, gray, green, red, orange, white-alpha, black-alpha)
   - Copy semantic aliases (accent, success, danger, warning)
   - Copy contrast colors
   - Wrap in `@theme inline`

2. Create `components/ui/styles/tokens/motion.css`:
   - Add 8 duration tokens
   - Add 9 easing curve tokens
   - Wrap in `@theme inline`

3. Create `components/ui/styles/utilities.css`:
   - Copy stroke width tokens
   - Copy `.fluent-focus-ring` utility
   - Wrap tokens in `@theme inline`

### Phase 3: Create Component Style Modules

**Steps**:
1. Create `components/ui/spinner/spinner.css`:
   - Copy all spinner keyframes from `app/globals.css`
   - Copy `.spinner-tail` class and pseudo-elements
   - Copy `@media (prefers-reduced-motion)` block

2. Create `components/ui/input/input.css`:
   - Add input focus indicator styles
   - Use motion tokens (`--duration-normal`, `--curve-easy-ease`)

### Phase 4: Update App Entry Point

**Steps**:
1. Backup `app/globals.css`:
   ```bash
   cp apps/web/app/globals.css apps/web/app/globals.css.backup
   ```

2. Replace `app/globals.css` content with:
   ```css
   @import "tailwindcss";
   @import "../components/ui/index.css";  /* Design system entrypoint */
   
   /* App-specific styles below */
   @theme inline {
     --font-sans: var(--font-geist-sans);
     --font-mono: var(--font-geist-mono);
   }
   ```

### Phase 5: Move Existing Component Files

**Steps**:
1. Move spinner component files (if not already in place):
   ```bash
   # Files should already be at:
   # apps/web/components/ui/spinner.tsx
   # apps/web/components/ui/spinner.test.tsx
   ```

2. Verify button component files are in place:
   ```bash
   # Files should already be at:
   # apps/web/components/ui/button.tsx
   # apps/web/components/ui/button.test.tsx
   # apps/web/components/ui/button.property.test.tsx
   ```

### Phase 6: Validation

**Steps**:
1. Run build:
   ```bash
   npm run build -w @mini-slack/web
   ```
   - Verify no CSS errors
   - Verify build succeeds

2. Run test suite:
   ```bash
   npm run test -w @mini-slack/web
   ```
   - Verify all tests pass
   - No component changes required

3. Start dev server:
   ```bash
   npm run dev -w @mini-slack/web
   ```
   - Manually test `/components/button`
   - Manually test `/components/spinner`
   - Manually test landing page `/`
   - Verify import path is correct in browser DevTools

4. Visual regression (if available):
   ```bash
   npm run test:visual -w @mini-slack/web
   ```

### Phase 7: Cleanup

**Steps**:
1. Remove backup file (if validation passes):
   ```bash
   rm apps/web/app/globals.css.backup
   ```

2. Update documentation:
   - Add comment to `components/ui/index.css` explaining import order
   - Document motion token usage in component guidelines
   - Update README with new structure

### Rollback Procedure

If validation fails:
```bash
mv apps/web/app/globals.css.backup apps/web/app/globals.css
rm -rf apps/web/components/ui/styles
rm apps/web/components/ui/index.css
rm apps/web/components/ui/spinner/spinner.css
rm apps/web/components/ui/input/input.css
```

## Tailwind CSS v4 Integration

### `@theme inline` Directive

Tailwind CSS v4 uses the `@theme inline` directive to define custom tokens that are available to Tailwind utilities.

**How It Works**:
1. Tokens defined inside `@theme inline` are registered with Tailwind's JIT compiler
2. Tailwind generates utilities for these tokens (e.g., `bg-accent-9`, `duration-normal`)
3. Tokens are also available as CSS custom properties for direct use in component styles

**Example**:
```css
/* In components/ui/styles/tokens/colors.css */
@theme inline {
  --color-accent-9: var(--purple-9);
}

/* Usage in Tailwind */
<button className="bg-accent-9">Click me</button>

/* Usage in CSS */
.custom-button {
  background-color: var(--color-accent-9);
}
```

### Token Availability

**Color Tokens**:
- Tailwind utilities: `bg-{color}-{step}`, `text-{color}-{step}`, `border-{color}-{step}`
- Examples: `bg-accent-9`, `text-gray-12`, `border-danger-7`

**Motion Tokens**:
- Duration utilities: `duration-{speed}`
- Examples: `duration-normal`, `duration-fast`
- Easing: Use `ease-[var(--curve-easy-ease)]` for custom curves

**Stroke Width Tokens**:
- Available as CSS custom properties only (not Tailwind utilities)
- Usage: `style={{ strokeWidth: 'var(--stroke-width-thick)' }}`

### Compatibility Notes

- **Tailwind CSS v4** is required (already in `package.json`)
- **PostCSS plugin** `@tailwindcss/postcss` is required (already configured)
- **No `tailwind.config.js`** needed — tokens defined in CSS via `@theme inline`

### Import Path Resolution

**Critical**: The design system entrypoint must be imported with the correct relative path from `app/globals.css`:

```css
/* ✅ Correct - from apps/web/app/globals.css to apps/web/components/ui/index.css */
@import "../components/ui/index.css";

/* ❌ Incorrect */
@import "../../components/ui/index.css";  /* Wrong: goes up too many levels */
@import "components/ui/index.css";        /* Wrong: not a relative path */
@import "@/components/ui/index.css";      /* Wrong: @ alias doesn't work in CSS imports */
```

**Path Calculation**:
- `app/globals.css` is at `apps/web/app/globals.css`
- Entrypoint is at `apps/web/components/ui/index.css`
- From `app/`, go up one level to `apps/web/` (`../`)
- Then into `components/ui/index.css`
- Final path: `../components/ui/index.css`

## Backward Compatibility Strategy

### Guaranteed Compatibility

**No Component Changes Required**:
- All existing token names remain unchanged
- All existing utility classes remain unchanged
- All existing animation classes remain unchanged

**Token Mapping**:
| Old Location | New Location | Token Name | Status |
|--------------|--------------|------------|--------|
| `globals.css` | `components/ui/styles/tokens/colors.css` | `--color-accent-9` | ✅ Unchanged |
| `globals.css` | `components/ui/styles/tokens/colors.css` | `--color-gray-12` | ✅ Unchanged |
| `globals.css` | `components/ui/styles/utilities.css` | `--stroke-width-thick` | ✅ Unchanged |
| `globals.css` | `components/ui/styles/utilities.css` | `.fluent-focus-ring` | ✅ Unchanged |
| `globals.css` | `components/ui/spinner/spinner.css` | `.spinner-tail` | ✅ Unchanged |
| N/A | `components/ui/styles/tokens/motion.css` | `--duration-normal` | ✨ New |
| N/A | `components/ui/styles/tokens/motion.css` | `--curve-easy-ease` | ✨ New |

### Validation Approach

**Automated Validation**:
1. Run existing test suite → must pass without changes
2. Build production bundle → must succeed without errors
3. Visual regression tests → must match baseline

**Manual Validation**:
1. Test all button variants on `/components/button`
2. Test all spinner sizes on `/components/spinner`
3. Test landing page components on `/`
4. Tab through interactive elements to verify focus ring

### Breaking Change Prevention

**Rules**:
- ❌ Do NOT rename existing tokens
- ❌ Do NOT change token values (except adding new motion tokens)
- ❌ Do NOT remove utility classes
- ❌ Do NOT change import paths in component files
- ✅ DO add new motion tokens
- ✅ DO reorganize file structure
- ✅ DO improve comments and documentation

## Implementation Notes

### File Creation Order

1. Create directory structure first (`components/ui/styles/tokens/`, component folders)
2. Create `components/ui/styles/tokens/colors.css` (most dependencies)
3. Create `components/ui/styles/tokens/motion.css` (independent)
4. Create `components/ui/styles/utilities.css` (depends on color tokens)
5. Create `components/ui/spinner/spinner.css` (independent)
6. Create `components/ui/input/input.css` (independent)
7. Create `components/ui/index.css` (orchestrates all imports)
8. Update `app/globals.css` last (imports entrypoint)

### Common Pitfalls

**Pitfall 1: Incorrect Import Paths in Entrypoint**
- ❌ `@import "styles/tokens/colors.css";` (missing `./`)
- ✅ `@import "./styles/tokens/colors.css";` (relative path)

**Pitfall 2: Incorrect Import Path in globals.css**
- ❌ `@import "../../components/ui/index.css";` (goes up too many levels)
- ❌ `@import "components/ui/index.css";` (not a relative path)
- ✅ `@import "../components/ui/index.css";` (correct relative path)

**Pitfall 3: Missing `@theme inline`**
- ❌ Tokens defined outside `@theme inline` won't be available to Tailwind
- ✅ Wrap all token definitions in `@theme inline`

**Pitfall 4: Wrong Import Order**
- ❌ Importing utilities before tokens causes undefined references
- ✅ Follow the documented import order in `components/ui/index.css`

**Pitfall 5: Forgetting Radix Imports**
- ❌ Defining `--color-purple-9: var(--purple-9);` without importing `@radix-ui/colors/purple.css`
- ✅ Import Radix CSS files before mapping to design system tokens

### Performance Considerations

**CSS Bundle Size**:
- Modular structure does NOT increase bundle size
- PostCSS processes all `@import` statements at build time
- Final bundle is identical to monolithic file

**Build Time**:
- No measurable impact on build time
- PostCSS import resolution is fast (<10ms per file)

**Runtime Performance**:
- No runtime impact
- CSS custom properties have identical performance regardless of file organization

## Future Enhancements

### Potential Additions

1. **Spacing Tokens** — `--spacing-{size}` for consistent margins/padding
2. **Typography Tokens** — `--font-size-{size}`, `--line-height-{size}`
3. **Shadow Tokens** — `--shadow-{elevation}` for consistent elevation
4. **Border Radius Tokens** — `--radius-{size}` for consistent rounding
5. **Z-Index Tokens** — `--z-{layer}` for consistent layering

### Extensibility

**Adding New Token Categories**:
1. Create new file in `components/ui/styles/tokens/` (e.g., `spacing.css`)
2. Define tokens within `@theme inline`
3. Add import to `components/ui/index.css` (maintain dependency order)
4. Document token usage in component guidelines

**Adding New Component Styles**:
1. Create new file in component folder (e.g., `components/ui/modal/modal.css`)
2. Define component-specific styles and animations
3. Add import to `components/ui/index.css`
4. Document component usage

### Extraction to Shared Package

The co-located structure enables easy extraction to `packages/ui`:

**Steps**:
1. Move `apps/web/components/ui/` to `packages/ui/`
2. Update `package.json` in `packages/ui/` with exports:
   ```json
   {
     "name": "@mini-slack/ui",
     "exports": {
       "./styles": "./index.css",
       "./button": "./button/button.tsx",
       "./spinner": "./spinner/spinner.tsx",
       "./input": "./input/input.tsx"
     }
   }
   ```
3. Update imports in `apps/web/app/globals.css`:
   ```css
   @import "@mini-slack/ui/styles";
   ```
4. Update component imports:
   ```typescript
   import { Button } from "@mini-slack/ui/button";
   ```

**Benefits**:
- Shared UI components across multiple apps
- Versioned design system
- Independent testing and deployment
- Clear API boundaries

## Summary

This design refactors the monolithic `globals.css` into a co-located, modular CSS architecture with:

- **Single entrypoint** (`components/ui/index.css`) for the entire design system
- **Feature-first co-location** — components, styles, and tests live together
- **7 files** organized by purpose (entrypoint, tokens, utilities, component styles)
- **8 duration tokens** + **9 easing curves** from Fluent Design System
- **Backward compatibility** — no component changes required
- **Tailwind CSS v4 integration** — tokens available to Tailwind utilities
- **Clear dependency ordering** — tokens before utilities before components
- **Extraction-ready** — structure enables moving to `packages/ui` later

The refactoring improves maintainability, enables easier navigation, adds motion tokens to support animated UI components, and prepares for future extraction to a shared package while maintaining 100% backward compatibility with existing code.

**Key Benefits**:
- ✅ Feature-first co-location (components + styles + tests together)
- ✅ Easy extraction to `packages/ui` later (just move the folder)
- ✅ Single import point for entire design system
- ✅ Clear boundary between design system and app-specific styles
