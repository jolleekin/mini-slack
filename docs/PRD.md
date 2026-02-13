# Product Requirements Document (PRD) - MiniSlack

## 1. Project Overview

**MiniSlack** is a high-performance, real-time messaging platform designed for team collaboration. It aims to provide a seamless experience for communication, file sharing, and workspace management, with a strong emphasis on architectural scalability and data isolation.

### Goals

- Provide a robust real-time messaging experience (Channels, Messages, DMs).
- Ensure high scalability and low latency via a partitioned architecture.
- Enable multi-tenant isolation from day one.
- Deliver a premium, responsive web and mobile experience.

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Target Audience](#2-target-audience)
- [3. Functional Requirements](#3-functional-requirements)
  - [3.1 Identity & Access](#31-identity--access)
  - [3.2 Messaging](#32-messaging)
  - [3.3 Search & discovery](#33-search--discovery)
- [4. Non-Functional Requirements](#4-non-functional-requirements)
  - [4.1 Performance & Scalability](#41-performance--scalability)
  - [4.2 Security & Isolation](#42-security--isolation)
- [5. Technical Architecture (High-Level)](#5-technical-architecture-high-level)
- [6. Interaction Flows & API Contract](#6-interaction-flows--api-contract)
  - [6.1 Authentication & Session Management](#61-authentication--session-management)
  - [6.2 Workspace Context & Switching](#62-workspace-context--switching)
  - [6.3 Real-time Messaging Flow](#63-real-time-messaging-flow)
  - [6.4 Mutations (Write Operations)](#64-mutations-write-operations)
  - [6.5 Server API (Public Contract)](#65-server-api-public-contract)
- [7. Capacity Estimation & Growth](#7-capacity-estimation--growth)
- [8. Domain Entities](#8-domain-entities)
- [9. Scaling Approach](#9-scaling-approach)
- [10. Future Roadmap](#10-future-roadmap)

## 2. Target Audience

- Small to large teams requiring a reliable communication tool.
- Developers looking for a reference architecture for high-scale real-time systems.

## 3. Functional Requirements

### 3.1 Identity & Access

- **Authentication**: Users must be able to sign in via OAuth or Magic Link/OTP.
- **Onboarding**: New users should be guided through a workspace creation or joining flow.
- **Profile Management**: Profile information (Name, Avatar) is managed **independently per workspace**. A global identity is maintained for authentication only.

### 3.2 Messaging

- **Workspaces**: Users can create, join, and manage multiple workspaces.
- **Channels**: Workspaces contain public and private channels.
- **Default Channel**: A public `#general` channel is created automatically with every workspace.
- **Auto-Join**: New workspace members are automatically added to `#general`.
- **Real-time Chat**: Messages delivered instantly to all active members of a channel.
- **Threads**: Support for threaded replies to individual messages.
- **Reactions**: Users can react to messages with emojis.
- **File Sharing**: Support for uploading and viewing images, videos, and documents.

### 3.3 Search & discovery

- **Full-text Search**: Search across messages, files, and channels within a workspace.
- **Workspace Discovery**: Join public workspaces or public channels within a workspace.

## 4. Non-Functional Requirements

### 4.1 Performance & Scalability

- **Low Latency**: Message delivery < 200ms (P95).
- **High Concurrency**: Support for 100k+ DAU in Phase 1, 10M+ in later phases.
- **Scalability**: Horizontal sharding of databases and services.

### 4.2 Security & Isolation

- **Tenant Isolation**: Data partitioned by `workspace_id`.
- **Encryption**: Data encrypted at rest and in transit.
- **Audit Logs**: Track critical workspace and administrative actions.

## 5. Technical Architecture (High-Level)

The system follows a **6-Tier Distributed Architecture** but starts as a **Modular Monolith** in Phase 1 for speed to MVP.

### Tech Stack (Phase 1)

- **Frontend/API**: Next.js 16+ (Monolith).
- **Real-time**: Node.js + `ws` library (Isolated Service).
- **Database**: PostgreSQL (Primary Store) + Redis (Cache/Streams).
- **ORM**: Prisma.
- **File Storage**: S3-compatible object storage.

## 6. Interaction Flows & API Contract

### 6.1 Authentication & Session Management

This flow details how users authenticate and how the system maintains session state across the scalable backend.

1.  **User Entry**: User visits landing page or **Invite Link** (e.g., `minislack.com/join/ws-slug`).
2.  **Authentication**: User authenticates (OAuth/Magic Link).
3.  **Token Issuance**: The API verifies credentials and returns:
    - **Access Token (JWT)**: Short-lived (15 min), contains **Identity Only** (User ID). Stored in memory.
    - **Refresh Token**: Long-lived (7 days), stored in an `HttpOnly; Secure; SameSite=Strict` cookie.
4.  **Routing Logic**:
    - **Invite Link**: Client adds user to workspace -> Redirects to Workspace.
    - **New User**: Redirects to `/welcome` -> User creates workspace or joins by slug.
    - **Returning User**: Redirects to **Last Active Workspace** (local state).
5.  **Token Rotation**: Failed requests with 401 trigger a call to `POST /api/auth/refresh` to get a new Access Token using the HttpOnly cookie.
6.  **WebSocket Init**: Connection established using `wss://...?access_token=<token>&workspace_id=<id>`.

### 6.2 Workspace Context & Switching

The system decouples Identity (Who you are) from Context (Where you are).

- **Client State**: The client stores the `active_workspace_id` in `localStorage`.
- **Context Header**: Every API request includes `X-Workspace-ID: <wsId>` alongside the `Authorization: Bearer <token>` header.
- **Switching**: To switch workspaces, the client simply updates the `X-Workspace-ID` header. **No re-authentication or token refresh is required.**
- **Validation**: Services validate that `User ID` (from JWT) is a member of `Workspace ID` (from header) via a cached lookup.
- **Membered Workspaces**: For efficient sidebar/switcher rendering, the system maintains a `MemberedWorkspaces` table partitioned by `user_id`. This allows listing a user's workspaces without cross-partition joins.

### 6.3 Real-time Messaging Flow

1.  **Send**: Client sends message via `POST /api/workspaces/:wsId/channels/:id/messages`.
2.  **Process**: API validates, saves to DB, and writes an event to the **Transactional Outbox** in the same transaction.
3.  **Publish**: The **Messaging Outbox Worker** picks up the event and publishes it to the **Event Bus**.
4.  **Broadcast**: The **WebSocket Service** consumes the event and broadcasts the payload to connected clients subscribed to that channel.
5.  **Receive**: Clients receive the message via WebSocket and update the UI.

### 6.4 Mutations (Write Operations)

All mutations use standard REST semantics via `fetch`.

```typescript
// Example: Sending a message.
async function sendMessage(content: string) {
  const res = await fetch(`/api/workspaces/${wsId}/channels/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`, // Identity
      "X-Workspace-ID": wsId, // Context
    },
  });
  return res.json();
}
```

### 6.5 Server API (Public Contract)

| Method   | Endpoint                                                    | Description                               |
| -------- | ----------------------------------------------------------- | ----------------------------------------- |
| `GET`    | `/.well-known/jwks.json`                                    | Public keys for JWT verification (by WSS) |
| `POST`   | `/api/auth/signin`                                          | Authenticate and set HttpOnly cookies     |
| `POST`   | `/api/auth/signout`                                         | Clear auth cookies                        |
| `POST`   | `/api/auth/refresh`                                         | Issue new access token                    |
| `GET`    | `/api/user/profile`                                         | Get current user profile                  |
| `PATCH`  | `/api/user/profile`                                         | Update user profile                       |
| `GET`    | `/api/workspaces`                                           | List user's workspaces                    |
| `POST`   | `/api/workspaces`                                           | Create workspace                          |
| `PATCH`  | `/api/workspaces/:wsId`                                     | Update workspace                          |
| `GET`    | `/api/workspaces/:wsId/channels`                            | List channels in workspace                |
| `POST`   | `/api/workspaces/:wsId/channels`                            | Create channel                            |
| `GET`    | `/api/workspaces/:wsId/channels/:channelId`                 | Get channel details                       |
| `PATCH`  | `/api/workspaces/:wsId/channels/:channelId`                 | Update channel                            |
| `DELETE` | `/api/workspaces/:wsId/channels/:channelId`                 | Delete channel                            |
| `POST`   | `/api/workspaces/:wsId/channels/:channelId/members`         | Add member to channel                     |
| `DELETE` | `/api/workspaces/:wsId/channels/:channelId/members/:userId` | Remove member from channel                |
| `GET`    | `/api/workspaces/:wsId/channels/:channelId/messages`        | List messages (paginated)                 |
| `POST`   | `/api/workspaces/:wsId/channels/:channelId/messages`        | Send message                              |
| `POST`   | `/api/workspaces/:wsId/files/upload-url`                    | Get S3 presigned upload URL               |
| `POST`   | `/api/workspaces/:wsId/invitations`                         | Create invitation (link/email)            |
| `GET`    | `/api/workspaces/:wsId/search`                              | Search messages                           |

## 7. Capacity Estimation & Growth

### Assumptions

- **Message Volume**: Average user sends **10 messages/day**; peak is **50 messages/user/day**
- **Attachments**: **1% of messages** contain attachments, **2MB average per file**
- **Message Size**: Text messages average **1 KB**, indexed messages slightly larger
- **Storage Multiplier**: Account for indexing, backups, and WAL logs (~30% overhead)

### Capacity Table

| Metric                      | Phase 1 (MVP) | Scaling Target | Long-term Target |
| :-------------------------- | :------------ | :------------- | :--------------- |
| **DAU**                     | 100K          | 1M             | 10M+             |
| **Msgs/Day (avg)**          | 1M            | 10M            | 100M             |
| **Write Throughput (avg)**  | 12 msg/sec    | 116 msg/sec    | 1,157 msg/sec    |
| **Write Throughput (peak)** | 58 msg/sec    | 580 msg/sec    | 5,787 msg/sec    |
| **Message Storage/Month**   | 30GB          | 300GB          | 3TB              |
| **File Storage/Month**      | 600GB         | 6TB            | 60TB             |
| **Total Storage/Month**     | 650GB-900GB   | 6.5-9TB        | 65-90TB          |

**Storage Breakdown (Phase 1 example):**

- 1M messages/day \* 30 days \* 1KB avg = ~30GB (messages)
- 1M messages/day \* 1% attachment rate \* 2MB \* 30 days = ~600GB (files)
- Total: ~650GB raw + ~30% overhead (indexing, backups) = ~850GB-900GB/month

## 8. Domain Entities

### Core Entities

| Entity                | Description                                                                                                                                                     |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**              | Global identity (ID, Email) for authentication. No persona information.                                                                                         |
| **Account**           | Links a User to an external auth provider (OAuth or Email/Password). Stores OAuth tokens and metadata.                                                          |
| **Session**           | Represents an active login session on a specific device/browser.                                                                                                |
| **Verification**      | Used for email verification and magic links.                                                                                                                    |
| **Workspace**         | Primary container for channels and members.                                                                                                                     |
| **Channel**           | Scoped within a workspace.                                                                                                                                      |
| **Message**           | Core unit of communication.                                                                                                                                     |
| **WorkspaceMember**   | Join table representing User + Workspace membership. Partitioned by `workspace_id`. Tracks roles and profile (name, avatar).                                    |
| **MemberedWorkspace** | Join table representing User + Workspace membership. Partitioned by `user_id`. Used for efficient workspace list retrieval.                                     |
| **ChannelMember**     | Join table representing User + Channel membership. Tracks channel-specific roles and muting preferences.                                                        |
| **File**              | Independent entity representing uploaded files. Scoped to workspace + channel. Supports dedicated file browser, independent metadata, and lifecycle management. |
| **MessageFile**       | Join table enabling many-to-many relationship between messages and files. Optimized with lazy loading and indexed queries to avoid N+1 joins on message lists.  |

## 9. Scaling Approach

MiniSlack follows an **evidence-based scaling strategy**, not a predefined roadmap.

- **Phase 1**: Build a modular monolith with strong observability
- **Monitoring**: Collect metrics as the system grows (DAU, API latency, DB CPU, etc.)
- **Decomposition**: When a bottleneck is identified, extract that service into a microservice with dedicated persistence
- **Repeat**: Continue monitoring and decomposing only when evidence justifies it

See [Scaling Strategy](./scaling-strategy.md) for detailed bottleneck patterns and decision criteria.

## 10. Future Roadmap

- **Phase 1 (Now)**: Monolith with observability. Target 100K DAU.
- **Decomposition 1 (6-12 months)**: Extract service causing first bottleneck (likely Messaging or Search).
- **Decomposition 2 (12-24 months)**: Extract second service. Deploy to multiple regions if global users exist.
- **Full Distributed (24-36 months)**: Kafka, Kubernetes, multi-region. Target 10M+ DAU.
