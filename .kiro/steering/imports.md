# Import Rules

## File Extensions

**Always include file extensions** in import statements for all local modules.

```typescript
// ✅ Correct
import { Button } from './button.tsx';
import { createChannel } from './service.ts';
import type { Channel } from './types.ts';

// ❌ Incorrect
import { Button } from './button';
import { createChannel } from './service';
import type { Channel } from './types';
```

**Rationale**: Explicit extensions improve compatibility with ESM, bundlers, and IDE tooling. Use `.ts`/`.tsx` extensions directly; TypeScript will resolve them correctly.

## Import Path Conventions

### Relative Paths for Same Feature/Folder

Use **relative paths** when importing modules within the same feature or folder.

```typescript
// In apps/web/lib/messaging/channels/service.ts
import { getChannel } from "../service.ts";

import { CHANNEL_NAME_MAX_LENGTH } from "./constants.ts";
import type { Channel, CreateChannelInput } from "./types.ts";
// In apps/web/lib/messaging/channels/members/service.ts
import type { ChannelMember } from "./types.ts";

// Parent folder
```

### `@/` Prefix for Other Project Modules

Use the **`@/` alias** when importing from other parts of the project (different features, shared utilities, etc.).

```typescript
// In apps/web/lib/messaging/channels/service.ts
import { workspaces } from "@mini-slack/db/schema";
import { ForbiddenError, NotFoundError } from "@mini-slack/errors";

// In apps/web/app/(app)/workspaces/page.tsx
import { Button } from "@/components/ui/button.ts";
import { db } from "@/lib/db.ts";
import { getRpcClient } from "@/lib/rpc/client.ts";
import { publishEvent } from "@/lib/server-utils.ts";
```

### Package Imports

Use **`@mini-slack/*` scope** for internal packages. **Always include explicit file paths with extensions**, even for internal packages.

```typescript
// ✅ Correct - explicit paths with extensions
import { db, schema } from '@mini-slack/db/index.ts';
import { NotFoundError, ForbiddenError } from '@mini-slack/errors/index.ts';
import { logger } from '@mini-slack/logger/index.ts';
import { generateId } from '@mini-slack/id-gen/index.ts';

// ❌ Incorrect - ambiguous imports
import { db, schema } from '@mini-slack/db';
import { NotFoundError } from '@mini-slack/errors';
```

**Rationale**: Internal packages lack `exports` fields in their `package.json`. Explicit imports eliminate ambiguity and avoid relying on Node.js's implicit index file resolution, which is a design flaw.

## Summary

| Import Type                                 | Path Style              | Extension Required    |
| ------------------------------------------- | ----------------------- | --------------------- |
| Same feature/folder                         | Relative (`./`, `../`)  | ✅ Yes (`.ts`/`.tsx`) |
| Different feature/shared module in same app | `@/` alias              | ✅ Yes (`.ts`/`.tsx`) |
| Internal packages                           | `@mini-slack/*/path.ts` | ✅ Yes (`.ts`)        |
| External packages                           | Package name            | ❌ No                 |

## Examples by File Location

### Service Layer

```typescript
// apps/web/lib/messaging/channels/service.ts
import { channels } from "@mini-slack/db/schema/index.ts";
import { NotFoundError } from "@mini-slack/errors/index.ts";

import type { ServiceContext, WorkspaceServiceContext } from "@/lib/context.ts";
import { db } from "@/lib/db.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import { CHANNEL_NAME_MAX_LENGTH } from "./constants.ts";
import type { Channel, CreateChannelInput } from "./types.ts";
```

### RPC Router

```typescript
// apps/web/lib/rpc/routers/channels.ts
import { z } from "zod";

import * as channelService from "@/lib/messaging/channels/service.ts";
import { createChannelInputSchema } from "@/lib/messaging/channels/types.ts";

import { workspaceProcedure } from "./orpc.ts";
```

### React Component

```typescript
// apps/web/app/(app)/workspaces/page.tsx
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.ts";
import { getSession } from "@/lib/identity/auth.ts";
import { getRpcClient } from "@/lib/rpc/client.ts";
```

### Test File

```typescript
// apps/web/tests/channels/service.test.ts
import { channels } from "@mini-slack/db/schema/index.ts";
import { beforeEach, describe, expect, it } from "vitest";

import * as channelService from "@/lib/messaging/channels/service.ts";
import { createTestDb } from "@/tests/helpers/db.ts";
```
