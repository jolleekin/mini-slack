# Phase 1: MVP Implementation Plan

**Target Scale**: <= 100,000 DAU  
**Focus**: Rapid development with strong domain boundaries

## Overview

Phase 1 delivers a fully functional real-time messaging application using a
**Modular Monolith** architecture. All business logic resides in a single
Next.js application, with dedicated workers for the messaging outbox and file cleanup (orphaned uploads/deleted attachments), and an isolated WebSocket service for real-time connections.

The system is designed with **Multi-Tenant Isolation** from day one, logically
partitioning all data by `workspace_id`.

![Phase 1 Architecture](./phase-1-architecture.svg)

## Table of Contents

- [1. Tech Stack](#1-tech-stack)
- [2. Project Structure](#2-project-structure)
- [3. Database Schema](#3-database-schema)
- [4. Task Breakdown](#4-task-breakdown)
  - [Milestone 1: Foundation](#milestone-1-foundation)
  - [Milestone 2: Database & Domain Logic](#milestone-2-database--domain-logic)
  - [Milestone 3: Next.js Application](#milestone-3-nextjs-application)
  - [Milestone 4: Real-time Infrastructure](#milestone-4-real-time-infrastructure)
  - [Milestone 5: Search & Polish](#milestone-5-search--polish)
  - [Milestone 6: Observability & Monitoring](#milestone-6-observability--monitoring)
- [5. Verification Plan](#5-verification-plan)
- [6. Related Documents](#6-related-documents)

## Tech Stack

| Layer         | Technology                                                              | Purpose                                            |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| **Framework** | [Next.js 16+](https://nextjs.org/)                                      | Full-stack Monolith (Landing Page + APP UI + API)  |
| **Styling**   | [TailwindCSS 4](https://tailwindcss.com/)                               | Utility-first CSS                                  |
| **Real-time** | [Node.js](https://nodejs.org/) + [ws](https://github.com/websockets/ws) | Live event broadcasting                            |
| **Database**  | [PostgreSQL](https://www.postgresql.org/)                               | Primary data store                                 |
| **ORM**       | [Prisma](https://www.prisma.io/)                                        | Type-safe database access                          |
| **Cache**     | [Redis](https://redis.io/)                                              | Session cache, entitlement cache, membership cache |
| **Event Bus** | Redis Streams                                                           | Internal async events                              |
| **Auth**      | JWT (Memory) + Refresh Token (HTTP-only Cookie)                         | Stateful-Stateless Hybrid model                    |
| **IDs**       | Snowflake IDs                                                           | 64-bit distributed monotonic IDs                   |

## Project Structure

```bash
├── apps/
│   └── web/                  # Next.js Monolith (Landing, App, API)
│       ├── app/              # App Router
│       │   ├── (landing)/    # / (Landing)
│       │   ├── (auth)/       # /login, /signin, /signup
│       │   ├── (app)/        # /workspaces, /channels (No Server Actions)
│       │   └── api/          # REST API endpoints
│       ├── components/       # Shared UI components
│       ├── lib/              # Feature-First Core
│       │   ├── identity/     # Service, types, schemas
│       │   ├── messaging/    # Message/Channel logic
│       │   ├── files/        # S3 orchestration
│       │   ├── search/       # Logic for full-text search
│       │   └── common/       # DB client, core utils
│       ├── middleware.ts     # Auth token verification and rotation logic
│       └── prisma/           # Schema & migrations
├── services/
│   └── wss/                  # Isolated WebSocket Service
│       ├── src/
│       │   ├── index.ts      # Verifies JWT via JWKS
│       │   └── redis/        # Stream consumer
├── workers/
│   ├── messaging-outbox/      # Messaging Outbox Worker
│   └── file-cleanup/          # File Cleanup Worker (orphaned uploads/deleted attachments)
├── packages/
│   ├── contracts/            # Shared TypeScript types
│   ├── id-gen/               # Snowflake ID generator
│   └── logger/               # Structured logging
└── infra/
    ├── docker-compose.yml    # Redis, Postgres
    └── postgres/             # Init scripts
```

## Database Schema

```sql
-- Users (Identity Domain - Global/Hash Partitioned)
CREATE TABLE users (
  id BIGINT PRIMARY KEY,           -- Snowflake ID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  image_url VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (Messaging Domain)
CREATE TABLE workspaces (
  id BIGINT PRIMARY KEY,           -- Snowflake ID
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members (Messaging Domain)
CREATE TABLE workspace_members (
  workspace_id BIGINT REFERENCES workspaces(id),
  user_id BIGINT REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Channels (Messaging Domain)
CREATE TABLE channels (
  workspace_id BIGINT REFERENCES workspaces(id),
  id BIGINT,                       -- Snowflake ID
  name VARCHAR(255) NOT NULL,
  owner_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, id)
);

-- Channel Members (Messaging Domain)
CREATE TABLE channel_members (
  workspace_id BIGINT,
  channel_id BIGINT,
  user_id BIGINT,
  last_seen_message_id BIGINT,
  PRIMARY KEY (workspace_id, channel_id, user_id),
  FOREIGN KEY (workspace_id, channel_id) REFERENCES channels(workspace_id, id)
);

-- Messages (Messaging Domain)
CREATE TABLE messages (
  workspace_id BIGINT,
  channel_id BIGINT,
  id BIGINT,                       -- Snowflake ID
  content TEXT NOT NULL,
  author_id BIGINT REFERENCES users(id), -- NULL for system messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, channel_id, id),
  FOREIGN KEY (workspace_id, channel_id) REFERENCES channels(workspace_id, id)
);

-- Files (Messaging Domain - Workspace Scoped for isolation/billing)
CREATE TABLE files (
  workspace_id BIGINT REFERENCES workspaces(id),
  id BIGINT,           -- Snowflake ID
  uploader_id BIGINT REFERENCES users(id),
  url VARCHAR(512) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  size BIGINT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, id)
);

-- Message Files (Many-to-Many link)
CREATE TABLE message_files (
  workspace_id BIGINT,
  channel_id BIGINT,
  message_id BIGINT,
  file_id BIGINT REFERENCES files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, channel_id, message_id, file_id),
  FOREIGN KEY (workspace_id, channel_id, message_id) REFERENCES messages(workspace_id, channel_id, id)
);

-- Reactions (Messaging Domain)
CREATE TABLE reactions (
  workspace_id BIGINT,
  channel_id BIGINT,
  id BIGINT,                       -- Snowflake ID
  message_id BIGINT,
  user_id BIGINT REFERENCES users(id),
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, channel_id, id),
  FOREIGN KEY (workspace_id, channel_id, message_id) REFERENCES messages(workspace_id, channel_id, id)
);

-- Transactional Outbox
CREATE TABLE outbox (
  workspace_id BIGINT,              -- For partitioned consumption
  id BIGSERIAL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id BIGINT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, id)
);

CREATE INDEX idx_outbox_unpublished ON outbox(created_at) WHERE published_at IS NULL;
```

## Task Breakdown

### Milestone 1: Foundation

- [x] **1.1 Monorepo Setup**
  - Initialize NPM workspaces
  - Configure TypeScript, ESLint, Prettier at root
  - Set up path aliases

- [x] **1.2 Snowflake ID Generator**
  - Implement in `packages/id-gen`
  - Custom epoch (2026-01-01)
  - Machine ID from environment variable
  - Export `generateId()` function

- [x] **1.3 Shared Packages**
  - `packages/contracts`: Shared TypeScript types & DTOs (types only, no validation)
  - `packages/logger`: Pino-based structured logging
  - `packages/errors`: `AppError`, `NotFoundError`, `ValidationError`
  - Note: Zod schemas live in domain modules (`lib/**/schemas.ts`)

### Milestone 2: Database & Domain Logic

- [ ] **2.1 Prisma Setup**
  - Install in `apps/web`
  - Define schema with BigInt IDs
  - Create initial migration

- [ ] **2.2 Feature Logic (Core Services)**
  - `lib/identity`: User CRUD, profile updates, session revocation logic
  - `lib/messaging`: Workspace, Channel, Message, and Reaction business logic
  - `lib/files`: Direct-to-S3 orchestration and attachment state updates
  - `lib/search`: Full-text search orchestration
  - `lib/common`: Prisma client initialization and transaction helpers

- [ ] **2.3 Transactional Outbox**
  - Add outbox table to schema
  - Create `publishEvent()` helper that writes to outbox in same transaction
  - Implement `USER_UPDATED` event to trigger denormalized profile sync

### Milestone 3: Next.js Application

- [ ] **3.1 App Router Setup**
  - Landing page (`/`)
  - Signin/Signup pages (`/signin`, `/signup`)
  - Shared layout with auth check
  - Auth middleware for token rotation

- [ ] **3.2 Custom Auth & Account API**
  - Signin endpoint (`POST /api/auth/signin`)
  - Profile Update endpoint (`PATCH /api/user/profile`)
  - Cookie management (JWT + Refresh with `SameSite=Lax`)
  - JWKS endpoint (`/.well-known/jwks.json`)

- [ ] **3.3 Workspace & Channel UI**
  - Workspace picker/creation flow
  - Sidebar with channel list (workspace-scoped, fetching from API)
  - Channel creation via API
  - Channel detail view with messages

- [ ] **3.4 Messaging & UI**
  - Message list with infinite scroll
  - Message input (POST to API)
  - File attachment support (S3 Direct Upload via API)
  - Emoji reaction picker
  - Unread count badges

### Milestone 4: Real-time Infrastructure

- [ ] **4.1 Messaging Outbox Worker**
  - Polling loop (100ms interval)
  - Batch processing (10 events)
  - Publish to Redis Streams
  - Mark as published

- [ ] **4.2 WebSocket Service**
  - JWT authentication via cookies
  - JWKS verification logic
  - Redis Streams consumer
  - Broadcast to channel members

- [ ] **4.3 File Cleanup Worker**
  - Identify orphaned uploads (PENDING > 24h)
  - Delete from S3/Object Storage
  - Mark as DELETED in DB

- [ ] **4.4 Client Integration**
  - WebSocket hook in React
  - Optimistic UI updates
  - Reconnection logic

### Milestone 5: Search & Polish

- [ ] **5.1 Postgres Full-Text Search**
  - GIN index on messages.content
  - Search API endpoint
  - Search UI with results

- [ ] **5.2 Production Readiness**
  - Error boundaries
  - Loading states
  - Mobile responsive layout

### Milestone 6: Observability & Monitoring

- [ ] **6.1 Structured Logging Setup**
  - Integrate Pino logger across all services (apps/web, services/wss, workers)
  - Log key events: API requests, message publishes, worker iterations
  - Include context: `workspace_id`, `user_id`, `trace_id`, `timestamp`
  - Centralize logs to stdout (Docker/K8s compatible)

- [ ] **6.2 Application Metrics**
  - HTTP endpoint metrics: latency (p50, p95, p99), error rates, request count by route
  - Database metrics: query count, query latency, connection pool usage
  - WebSocket metrics: connection count, active subscriptions, message throughput, delivery latency
  - Worker metrics: queue depth, processing time, error rate per worker
  - Blob Store metrics: file upload throughput (MB/s), error rates
  - Install `@opentelemetry/api` and `@opentelemetry/auto` (or instrument manually with Prometheus client)

- [ ] **6.3 Health Checks & Alerts**
  - HTTP endpoint: `GET /api/health` (returns JSON with service status, DB connection, Redis connection)
  - Periodic background check: Alert if outbox publishes are lagging (> 1 second)
  - Database slow query log: Alert on queries > 500ms

- [ ] **6.4 Monitoring Dashboard (Local)**
  - Use Prometheus + Grafana in `docker-compose.yml`
  - Key dashboards:
    - **API Performance**: Request latency, error rate, throughput by endpoint
    - **Database Health**: Query latency, connection pool, disk usage
    - **Real-time Health**: Active WebSocket connections, message delivery rate
    - **Worker Health**: Outbox queue depth, file cleanup iterations
  - Export graphs for decision-making (DAU milestones at 25K, 50K, 75K, 100K)

- [ ] **6.5 Business Metrics**
  - Track: DAU, WAU, MAU (from auth logs)
  - Track: Messages/sec, Channels/workspace, File uploads/day
  - Track: P95 message delivery latency
  - Use these to correlate with system bottlenecks

## Verification Plan

### Automated Tests

```bash
# Unit tests
npm run test -w packages/id-gen
npm run test -w packages/contracts

# Integration tests
npm run test:integration -w apps/web
```

### Manual Verification

- [ ] Login flow sets `jwt` and `refresh_token` cookies
- [ ] Token rotation works via middleware
- [ ] WebSocket server verifies JWT via JWKS
- [ ] Messages appear in real-time for all channel members
- [ ] Mobile layout is usable
- [ ] Observability: Logs are structured and searchable
- [ ] Observability: Dashboards show expected metrics at various load levels

## Related Documents

- [Product Requirements](../PRD.md)
- [Architecture Overview](../architecture.md)
- [Scaling Strategy](../scaling-strategy.md) - Evidence-based evolution from monolith to microservices
