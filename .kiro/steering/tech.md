# Tech Stack

## Runtime & Framework
- **Next.js 16+** (App Router) — web app and API server
- **React 19** — UI
- **TypeScript** — all packages and apps
- **Node.js** — runtime for Next.js and services

## API Layer
- **oRPC** (`@orpc/server`, `@orpc/client`) — type-safe RPC framework; procedures served at `/api/rpc`
- **Better Auth** — authentication (OAuth via GitHub, Magic Link); routes at `/api/auth/[...all]`

## Database & ORM
- **PostgreSQL** — primary data store
- **Drizzle ORM** (`drizzle-orm`) — schema definition, queries, migrations
- **Drizzle Kit** — migration generation (`drizzle.config.ts` in `packages/db`)
- **`postgres` driver** — production DB client
- **PGlite** (`@electric-sql/pglite`) — in-memory Postgres for tests

## Styling
- **Tailwind CSS v4** with `@tailwindcss/postcss`

## Testing
- **Vitest** — test runner (`vitest run` for single-pass, no watch mode)
- **fast-check** — property-based testing
- Tests live in `apps/web/tests/` mirroring the source structure

## Key Libraries
- `jose` — JWT verification (Edge Runtime compatible)
- `zod` — input validation / schema definitions for RPC types
- `pino` / `@mini-slack/logger` — structured logging
- `@mini-slack/id-gen` — custom ID generation (sequential + random)
- `@mini-slack/events` — typed domain event definitions
- `@mini-slack/errors` — typed application error classes (`AppError`, `NotFoundError`, `ForbiddenError`, etc.)
- `@mini-slack/i18n` — error message translation

## Infrastructure
- **Docker Compose** (`infra/docker-compose.yml`) — local Postgres + Redis
- **dotenv-cli** — env injection for scripts (`.env` at repo root)

## Common Commands

All commands run from the **repo root** using the `-w` workspace flag.

```powershell
# Install dependencies
npm install

# Run the web app (dev)
npm run dev -w @mini-slack/web

# Build the web app
npm run build -w @mini-slack/web

# Run tests (single pass)
npm run test -w @mini-slack/web

# Lint
npm run lint -w @mini-slack/web

# Generate DB migrations (from packages/db)
npm run db:generate -w @mini-slack/db

# Apply DB migrations
npm run db:migrate -w @mini-slack/db
```

## Environment
- `.env` lives at the repo root and is injected via `dotenv-cli` in all scripts
- Required variables include `DATABASE_URL`, `JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- See `.env.example` for the full list
