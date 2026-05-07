# Spec Generation Guidelines

## Spec Naming Convention

This is a monorepo with multiple apps, packages, and services. Spec names **must use namespaces** to clearly indicate scope and ownership.

### Namespace Format

Use dot-separated namespaces that mirror the monorepo structure:

```
<workspace>.<package/app>.<feature>.<subfeature>
```

### Examples

**Apps:**
- `apps.web.auth-pages` — authentication pages in the web app
- `apps.web.common-ui.button` — button component in shared UI
- `apps.web.workspaces.list` — workspace list page
- `apps.web.channels.create` — channel creation feature

**Packages:**
- `packages.db.migrations.add-reactions` — database migration for reactions
- `packages.errors.validation` — validation error types
- `packages.id-gen.performance` — ID generation optimization

**Services:**
- `services.wss.connection-pooling` — WebSocket connection pooling
- `services.wss.presence` — user presence tracking

**Workers (future):**
- `workers.outbox.consumer` — outbox event consumer
- `workers.notifications.email` — email notification worker

### Naming Rules

1. **Always namespace** — never use flat names like `auth-pages` or `button`
2. **Use kebab-case** — `common-ui`, not `commonUI` or `common_ui`
3. **Be specific** — `apps.web.channels.create` is better than `apps.web.channels`
4. **Mirror structure** — follow the actual folder hierarchy when possible
5. **Scope appropriately** — if a spec affects multiple workspaces, use a broader namespace (e.g., `infra.docker-compose`)

### Directory Structure

Spec folders should match the namespace:

```
.kiro/specs/
├── apps.web.auth-pages/
├── apps.web.common-ui.button/
├── apps.web.workspaces.list/
├── packages.db.migrations.add-reactions/
└── services.wss.connection-pooling/
```

## Spec Scope Guidelines

### When to Create a Spec

Create a spec for:
- **New features** — any user-facing functionality
- **Architectural changes** — refactoring, new patterns, infrastructure updates
- **Cross-cutting concerns** — changes affecting multiple domains or layers
- **Complex bug fixes** — issues requiring design decisions or multi-file changes

### Scope Sizing

- **Small scope** — single component, single service function, isolated bug fix
- **Medium scope** — feature spanning multiple components, new API endpoint with UI
- **Large scope** — new domain, multi-page flow, infrastructure change

Keep specs focused. Break large features into multiple namespaced specs:
- `apps.web.messaging.threads` (backend + API)
- `apps.web.messaging.threads.ui` (frontend components)
- `apps.web.messaging.threads.notifications` (notification integration)

## Spec Content Structure

Each spec should follow the standard structure:

1. **requirements.md** — what we're building and why
2. **design.md** — how we'll build it (architecture, patterns, tradeoffs)
3. **tasks.md** — implementation checklist

### Cross-References

Use `#[[file:path/to/file]]` to reference:
- Schema files: `#[[file:packages/db/schema/messaging/channels.ts]]`
- API specs: `#[[file:docs/api/openapi.yaml]]`
- Related code: `#[[file:apps/web/lib/messaging/channels/service.ts]]`

## Migration Path

Existing specs without namespaces should be migrated:
- `auth-pages` → `apps.web.auth-pages`
- `common-ui` → `apps.web.common-ui`
- `landing-page` → `apps.web.landing-page`
- `app-router-shell` → `apps.web.app-router-shell`
- `signin-redirect-param` → `apps.web.signin-redirect-param`

When creating new specs, always use the namespaced format.
