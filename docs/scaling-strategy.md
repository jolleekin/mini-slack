# Scaling Strategy: Evidence-Based Evolution

> MiniSlack scales **reactively** by identifying real bottlenecks and decomposing services only when evidence justifies it.

## Table of Contents

- [1. Philosophy](#1-philosophy)
- [2. Monitoring Metrics (The Signals)](#2-monitoring-metrics-the-signals)
- [3. Bottleneck Patterns & Decomposition](#3-bottleneck-patterns--decomposition)
- [4. Decision Criteria for Decomposition](#4-decision-criteria-for-decomposition)
- [5. Related Documents](#5-related-documents)

## Philosophy

The **6-Tier Distributed Architecture** in [Architecture Overview](./architecture.md) serves as a **North Star** - a vision of what the system becomes at 10M+ DAU. However, the path to reach that scale is **not predefined**.

Instead, we follow this principle:

> **"Build the simplest system that works. Measure. When a bottleneck emerges, decompose that component into a focused microservice with dedicated persistence and workers."**

This approach provides:

- - **Cost efficiency**: No premature infrastructure
- - **Simplicity**: Monolith until forced to scale
- - **Evidence-driven**: Decisions based on real usage patterns, not theory
- - **Agility**: Decompose only the service that's actually struggling

## Monitoring Framework

### Key Metrics (Collected in Phase 1)

Every evolution decision is grounded in these metrics:

#### **Business Metrics**

| Metric                    | Collection Method                                               | Purpose                  |
| ------------------------- | --------------------------------------------------------------- | ------------------------ |
| **DAU**                   | User login events in logs                                       | Track scale milestone    |
| **Peak Concurrent Users** | WebSocket connection count                                      | Real-time load indicator |
| **Message Throughput**    | Messages/sec (from outbox worker)                               | Write load intensity     |
| **Storage Growth**        | Database and S3 disk usage                                      | Persistence layer health |
| **File Upload Rate**      | Upload throughput (MB/s) measured from presigned upload latency | Upload bandwidth health  |

#### **System Metrics**

| Metric                       | Collection Method                           | Decision Threshold | Mitigation                                       |
| ---------------------------- | ------------------------------------------- | ------------------ | ------------------------------------------------ |
| **API Latency (p95)**        | Prometheus from middleware                  | > 200ms            | Identify slow endpoints → optimize or extract    |
| **Database CPU**             | PostgreSQL `pg_stat_statements`             | > 70% for 2+ weeks | Analyze query patterns → add replicas or shard   |
| **Database Connection Pool** | `max_connections` - `available_connections` | > 80% utilization  | Extract service to reduce pool contention        |
| **Redis Memory**             | Redis `INFO memory`                         | > 80% utilization  | Profile hit rates → add eviction or replicas     |
| **WebSocket Latency**        | Message delivery time (client-measured)     | > 500ms            | Add WSS partitioning or regional distribution    |
| **Outbox Lag**               | `MAX(published_at - created_at)` in outbox  | > 5 seconds        | Increase worker batch size or frequency          |
| **Worker Queue Depth**       | Pending items in Redis queues               | > 10K items        | Add worker replicas or extract dedicated service |

### Observability Stack (Phase 1)

| Layer          | Tools                                        | Purpose                             |
| -------------- | -------------------------------------------- | ----------------------------------- |
| **Logs**       | Pino (structured) → Stdout → Docker/K8s logs | Debugging, tracing, business events |
| **Metrics**    | Prometheus + OpenTelemetry                   | System health tracking              |
| **Dashboards** | Grafana (local dev), Time-series DB (prod)   | Real-time bottleneck visibility     |
| **Alerting**   | Prometheus rules + PagerDuty/Email           | On-call notifications               |

## Bottleneck Identification & Response

### Common Bottleneck Patterns

Each pattern has a **trigger condition** and a **decomposition strategy**.

#### **Pattern 1: API Bottleneck (Messaging Service)**

**Symptoms:**

- `POST /api/workspaces/:wsId/channels/:id/messages` latency > 200ms p95
- Database CPU consistently > 70%
- `INSERT` operations in `messages` table are slow

**Root Causes:**

- Message writes are high-velocity (100+ msg/sec)
- Contention on `channel_id` index
- Denormalized membership updates in same transaction

**Evidence Gate:**

- [x] p95 latency > 200ms for 2+ weeks
- [x] Single endpoint accounts for > 40% of database CPU
- [x] Throughput > 1K msg/sec

**Decomposition Strategy:**

1. Extract **Messaging Service** into `services/messaging`
2. Move message-related domain logic from `lib/messaging` to service
3. Dedicated PostgreSQL **Messaging DB** partitioned by `(workspace_id, channel_id)`
4. Keep write replicas of Identity and Subscription stores as read-only references
5. Communication: REST or gRPC between Messaging and other domains (via API Gateway)

**Post-Decomposition:**

- Messaging Service scales independently (more replicas, connection pooling)
- Database can be sharded by `workspace_id` later if single node hits limits
- Outbox worker continues polling from Messaging DB

#### **Pattern 2: Search Bottleneck**

**Symptoms:**

- `GET /api/workspaces/:wsId/search` latency > 1s
- Full-text search queries block other queries on same DB
- Users complain about slow search results

**Root Causes:**

- Postgres FTS GIN index is insufficient
- Search queries are I/O-bound
- Index maintenance competing with message writes

**Evidence Gate:**

- [x] Search queries > 100 searches/day
- [x] p95 latency > 1 second
- [x] Search query accounts for > 10% of database CPU

**Decomposition Strategy:**

1. Extract **Search Service** into `services/search`
2. Deploy **Meilisearch** instance (or OpenSearch for scale)
3. Add **Search Indexer Worker** to consume message events and index asynchronously
4. Replace Postgres FTS endpoint with call to Meilisearch
5. Search DB is eventually consistent (typically < 1 second behind primary)

**Post-Decomposition:**

- Search Service scales independently
- Messaging latency is no longer affected by search index maintenance

#### **Pattern 3: WebSocket Connection Limit**

**Symptoms:**

- WebSocket connection count at 90%+ of `ulimit -n`
- New users get "connection refused" errors
- p95 message delivery latency spikes

**Root Causes:**

- File descriptor limit hit on single WSS instance
- All user connections concentrated on one node
- No horizontal scaling of WSS instances

**Evidence Gate:**

- [x] Peak concurrent connections > 50K
- [x] New connection rejections logged
- [x] Message delivery latency degrades with connection count

**Decomposition Strategy:**

1. **Event Partitioning (for ordering)**: Design the event bus to partition by channel ID to maintain message order within a channel.
   - Option A (many small partitions): `partition_id = channel_id` (i.e. `num_partitions = Infinity`) - one Redis Stream or Kafka topic per channel. Simple but creates many small streams.
   - Option B (fewer large partitions): `partition_id = channel_id % num_partitions` - limit the number of partitions (e.g., 100-1000 partitions) by mapping multiple channels to each partition. Easier to manage, still maintains ordering.
   - WSS instances must know `num_partitions` to compute which partition(s) to subscribe to when a user connects.

2. **WSS Instance Scaling (independent of event partitions)**: Deploy multiple WSS instances and use the WS Gateway for load-based routing.
   - WS Gateway routes WebSocket upgrade requests to the least-loaded WSS instance (measured by connection count and/or event throughput).
   - WS Gateway does not assign partitions to instances; instances are fungible and scalable independently.

3. **Connect-time Subscription**: When a user establishes a WebSocket connection to a WSS instance:
   - WSS reads the user's `ChannelMember` list from the membership cache (Redis) or service.
   - For each channel, WSS computes the event partition: `partition_id = channel_id % num_partitions`.
   - WSS subscribes to only those event partitions (streams) and broadcasts messages to the connected user.

**Post-Decomposition:**

- WSS scales horizontally with load (instance count is independent of event partition count).
- Event ordering is guaranteed within each partition (channel ID is consistent across reconnects).
- No single node is a bottleneck for real-time delivery; users are distributed by the Gateway.

#### **Pattern 4: Database Connection Pool Exhaustion**

**Symptoms:**

- Connection pool errors: "Cannot acquire connection"
- Services are timing out waiting for DB connections
- Irregular latency spikes

**Root Causes:**

- Monolith is using all connections
- Long-running queries holding connections
- Bulk operations (file cleanup, indexing) competing with user API requests

**Evidence Gate:**

- [x] `(max_connections - available) / max_connections > 80%` for 1+ hour
- [x] Connection timeout errors in logs
- [x] Multiple services sharing same pool

**Decomposition Strategy:**

1. Extract offending service (usually a Worker or heavy background job)
2. Give each service/worker its own connection pool
3. Use **PgBouncer** or **Supavisor** for connection pooling if needed
4. Set conservative connection limits per service (e.g., API: 50, Worker: 10)

**Post-Decomposition:**

- Services are isolated; one service's pool exhaustion doesn't affect others

## Database Scaling Strategy

MiniSlack uses an evidence-based approach to database architecture, starting with a robust monolith and evolving toward a sharded, multi-domain system.

### Phase 1 (Short-term): The Resilient Monolith

In Phase 1, all data resides in a single PostgreSQL instance. We prioritize simplicity while maintaining paths for future sharding.

- **Storage**: All tables in the same DB instance.
- **Outbox**: A **Single Transactional Outbox** for all domain events.
  - To support future scale, we include a `partition_key` (derived from `user_id`, `workspace_id` or `channel_id`) in every outbox record.
- **Identity Retrieval**: O(1) sidebar "My Workspaces" retrieval is achieved via a dedicated database index: `workspace_members(user_id)`.
- **Global Constraints**: Enforced via standard unique indexes (e.g., `users(email)`, `workspaces(slug)`).

### Long-term: Sharded & Partitioned Store

When metrics (CPU, connection limits, I/O) justify separation, the system evolves into sharded domains.

#### **Identity Domain**

- `users`, `accounts`, `sessions`: Shard by `user_id`.
- `verifications`: Shard by `identifier`.
- **Global Indexes**:
  - `email -> user_id`
  - `(provider_id, provider_account_id) -> user_id`
  - `slug -> workspace_id`

#### **Messaging Domain**

- `workspaces`, `channels`, `messages`, `reactions`, `files`, `messaging_outbox`: Shard by `workspace_id`.
- `workspace_members`, `invitations`: Shard by `workspace_id`.

#### Infrastructure

1. **Outbox Splitting and Partitioning**: table `outbox` is split by domain, and each domain-specific table is partitioned by `partition_key`.
2. **Worker Parallelism**: Run multiple instances of the **Messaging Outbox Worker**, each responsible for a specific subset of partitions. This eliminates the "single tail" bottleneck while maintaining ordering guarantees per partition.
3. **Hot Channel Mitigation**: Extremely active channels or workspaces can be assigned dedicated outbox partitions to prevent them from lagging others.

#### **Double-Sided Sync**

To maintain O(1) workspaces-by-user retrieval, we introduce table `workspaces_by_user` to the Identity Store.

- Partitioned by `user_id`.
- Replicates workspace name/logo.
- Synchronized via workspace events consumed by the **Membership Sync Worker**.

## Decision Criteria for Decomposition

Before extracting a service, ensure all of the following are true:

| Criteria                   | Rationale                                                                       |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Evidence Gate Met**      | Data shows bottleneck at specific component, not theoretical                    |
| **Optimization Exhausted** | Tried caching, indexes, connection pooling, query optimization within monolith  |
| **Clear Domain Boundary**  | Service has distinct responsibility (Messaging, Search, Subscription, Identity) |
| **Team Capacity**          | Dedicated team member(s) to own and operate the service                         |
| **Cost-Benefit Analyzed**  | Operational overhead justified by performance gain                              |
| **Observability Plan**     | Can monitor service health independently (metrics, logs, tracing)               |

## Communication & Runbooks

### Pre-Decomposition: What to Communicate

- [ ] Bottleneck identified (metrics)
- [ ] Root cause analysis
- [ ] Proposed decomposition strategy
- [ ] Timeline and team assignments

### Post-Decomposition: What to Document

- [ ] Service separation & communication contracts (REST, gRPC, events)
- [ ] Database connection strings and credentials (secure vault)
- [ ] Scaling runbook (how to add replicas)
- [ ] Failure modes (what happens if service is down)
- [ ] Monitoring dashboard (health & performance)
- [ ] Rollback procedure (if decomposition causes issues)

## Related Documents

- [Architecture Overview](./architecture.md) - 6-Tier target architecture (North Star)
- [Phase 1 Implementation Plan](./phase-1-mvp/implementation-plan.md) - How to build the monolith with observability
- [PRD](./PRD.md) - Product requirements
