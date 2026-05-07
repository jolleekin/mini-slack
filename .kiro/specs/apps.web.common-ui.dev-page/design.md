# Design Document: Component Dev Page

## Overview

This document describes the technical design for the component showcase at `/dev/components`. The showcase provides a sidebar navigation and individual pages for each UI component, allowing developers to visually inspect component variants during development. It is only accessible in development mode.

The showcase lives in `apps/web/app/(dev)/components/` with a shared layout providing sidebar navigation and individual pages for each component.

---

## Architecture

### File Structure

```
apps/web/app/(dev)/
├── layout.tsx                      ← Dev-only layout (checks NODE_ENV)
└── components/
    ├── layout.tsx                  ← Sidebar navigation layout
    ├── page.tsx                    ← Index page (component list)
    ├── button/
    │   └── page.tsx                ← Button showcase
    ├── spinner/
    │   └── page.tsx                ← Spinner showcase
    ...
```

---

## Route Protection

### Dev Layout (`apps/web/app/(dev)/layout.tsx`)

```typescript
import { notFound } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <>{children}</>;
}
```

This layout ensures that all routes under `(dev)` return a 404 in production.

---

## Page Structure

### Components Layout (`apps/web/app/(dev)/components/layout.tsx`)

Provides a two-column layout with sidebar navigation:

```typescript
const components = [
  { name: "Button", href: "/components/button" },
  { name: "Spinner", href: "/components/spinner" },
];

export default function ComponentsLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar with component links */}
      <aside className="w-64 border-r border-gray-a6 bg-gray-a2 p-6">
        {/* Navigation links */}
      </aside>
      
      {/* Main content area */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

### Index Page (`apps/web/app/(dev)/components/page.tsx`)

Landing page that lists all available components with descriptions.

### Individual Component Pages

Each component has its own page at `/dev/components/{component-name}/page.tsx`:

---

## Dependencies

- All UI components
- Next.js `notFound()` for route protection
