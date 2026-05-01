import * as schema from "@mini-slack/db/index.ts";
import { ConflictError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceCreatedEvent,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
} from "@mini-slack/events";
import { createTranslator } from "@mini-slack/i18n";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { ServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "@/lib/messaging/workspaces/service.ts";
import { createTestDb } from "@/tests/helpers/db";

describe("workspaces service", () => {
  let db: Db;
  const userId = "123456789";
  const t = createTranslator(en);

  beforeAll(async () => {
    db = await createTestDb();
    // Seed user.
    await db.insert(schema.users).values({
      id: userId,
      name: "Test User",
      email: "test@example.com",
    });
  });

  it("createWorkspace successfully persists to in-memory DB", async () => {
    const ctx: ServiceContext = {
      actor: {
        type: "user",
        id: userId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
      },
      db,
      t,
    };

    const input = {
      name: "Test WS",
      slug: "test-ws",
      defaultChannelName: "general",
    };

    const result = await createWorkspace(ctx, input);

    // Verify persistence using real queries.
    const [persistedWS] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, result.workspace.id))
      .limit(1);
    expect(persistedWS).toBeDefined();
    expect(persistedWS.name).toBe(input.name);
    expect(persistedWS.slug).toBe(input.slug);

    // Verify member creation.
    const [member] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, result.workspace.id),
          eq(schema.workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    expect(member).toBeDefined();
    expect(member.role).toBe("owner");

    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(eq(schema.outbox.eventType, EventType.WORKSPACE_CREATED))
      .limit(1);

    expect(event).toBeDefined();
    expect(event.aggregateId).toBe(result.workspace.id);
    expect(event.actorId).toBe(userId);
    expect(event.aggregateType).toBe(AggregateType.WORKSPACE);
    expect(event.eventType).toBe(EventType.WORKSPACE_CREATED);

    const payload = event.payload as WorkspaceCreatedEvent["payload"];

    expect(payload.workspace.id).toBe(result.workspace.id);
    expect(payload.workspace.name).toBe(input.name);
    expect(payload.workspace.slug).toBe(input.slug);
    expect(payload.ownerId).toBe(userId);
  });

  it("listWorkspaces lists real data from DB", async () => {
    const ctx: ServiceContext = {
      actor: {
        type: "user",
        id: userId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
      },
      db,
      t,
    };

    const result = await listWorkspaces(ctx, {});
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Test WS");
    expect(result[0].role).toBe("owner");
  });

  it("createWorkspace throws ConflictError on duplicate slug", async () => {
    const ctx: ServiceContext = {
      actor: {
        type: "user",
        id: userId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
      },
      db,
      t,
    };

    const input = {
      name: "Another WS",
      slug: "test-ws",
      defaultChannelName: "general",
    };

    await expect(createWorkspace(ctx, input)).rejects.toThrow(ConflictError);
  });

  it("updateWorkspace updates workspace details and publishes event", async () => {
    const ctx: ServiceContext = {
      actor: {
        type: "user",
        id: userId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
      },
      db,
      t,
    };

    // Note: We use the existing workspace created in the first test
    const workspaces = await listWorkspaces(ctx, {});
    const workspaceId = workspaces[0].id;

    await updateWorkspace({ ...ctx, workspaceId }, { name: "Updated Name" });

    const [updated] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId))
      .limit(1);

    expect(updated).toBeDefined();
    expect(updated.name).toBe("Updated Name");

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.WORKSPACE_UPDATED),
          eq(schema.outbox.aggregateId, workspaceId),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.aggregateType).toBe(AggregateType.WORKSPACE);
    expect(event.actorId).toBe(userId);

    const payload = event.payload as WorkspaceUpdatedEvent["payload"];
    expect(payload.workspace.id).toBe(workspaceId);
    expect(payload.workspace.name).toBe("Updated Name");
  });

  it("deleteWorkspace deletes workspace completely and publishes event", async () => {
    const ctx: ServiceContext = {
      actor: {
        type: "user",
        id: userId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
      },
      db,
      t,
    };

    // Note: We use the existing workspace created in the first test
    const workspaces = await listWorkspaces(ctx, {});
    const workspaceId = workspaces[0].id;

    await deleteWorkspace({ ...ctx, workspaceId }, {});

    const [deleted] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId))
      .limit(1);

    expect(deleted).toBeUndefined();

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.WORKSPACE_DELETED),
          eq(schema.outbox.aggregateId, workspaceId),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.aggregateType).toBe(AggregateType.WORKSPACE);
    expect(event.actorId).toBe(userId);

    const payload = event.payload as WorkspaceDeletedEvent["payload"];
    expect(payload.workspaceId).toBe(workspaceId);
  });
});
