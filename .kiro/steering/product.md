# Product: MiniSlack

MiniSlack is a high-performance, real-time team messaging platform — a Slack-like system built as a reference architecture for scaling from a modular monolith to a 6-tier distributed system.

## Core Features
- **Workspaces**: Multi-tenant containers; users can belong to multiple workspaces with independent personas (name, avatar) per workspace
- **Channels**: Public and private channels within a workspace; a `#general` channel is auto-created with every workspace
- **Messaging**: Real-time chat with threads, reactions, and file sharing
- **Identity**: OAuth (GitHub) and Magic Link authentication via Better Auth; authentication is global, profiles are workspace-scoped

## Key Design Principles
- **Tenant isolation**: All data is partitioned by `workspace_id`
- **Decoupled identity from context**: JWT carries identity only; workspace context is passed via `X-Workspace-ID` header
- **Transactional Outbox**: All domain events are written to an `outbox` table in the same DB transaction as the mutation, then consumed by workers
- **Evidence-based scaling**: Phase 1 is a modular monolith with observability; services are extracted only when a bottleneck is measured

## Current Phase
Phase 1 MVP — Next.js monolith targeting 100K DAU. Real-time is handled by an isolated WebSocket service.
