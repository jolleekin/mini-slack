import * as schema from "@mini-slack/db/index.ts";
import { ConflictError, ForbiddenError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceMemberRemovedEvent,
} from "@mini-slack/events/index.ts";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/lib/messaging/workspaces/members/service.ts";
import { createTestDb } from "@/tests/helpers/db.ts";

describe("workspace members service", () => {
  let db: Db;
  const t = createTranslator(en);

  const workspaceId = "1000000000000001";
  const ownerId = "2000000000000001";
  const memberId = "2000000000000002";
  const outsiderId = "2000000000000003";

  beforeAll(async () => {
    db = await createTestDb();

    // Seed workspace.
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "Test Workspace",
      slug: "test-ws",
    });

    // Seed members.
    await db.insert(schema.workspaceMembers).values([
      {
        workspaceId,
        userId: ownerId,
        email: "owner@test.com",
        emailVerified: true,
        role: "owner",
      },
      {
        workspaceId,
        userId: memberId,
        email: "member@test.com",
        emailVerified: true,
        role: "member",
      },
    ]);
  });

  it("listWorkspaceMembers throws if user is not a member", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: outsiderId,
        name: "Outsider",
        email: "out@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await expect(listWorkspaceMembers(ctx, {})).rejects.toThrow(ForbiddenError);
  });

  it("listWorkspaceMembers returns all members for a valid member", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: memberId,
        name: "Member",
        email: "member@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const members = await listWorkspaceMembers(ctx, {});
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.userId)).toEqual(
      expect.arrayContaining([ownerId, memberId]),
    );
  });

  it("updateWorkspaceMemberRole prevents downgrading the last owner", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await expect(
      updateWorkspaceMemberRole(ctx, { userId: ownerId, role: "admin" }),
    ).rejects.toThrow(ConflictError);
  });

  it("updateWorkspaceMemberRole succeeds when there are multiple owners", async () => {
    // Promote member to owner first so we have 2 owners.
    const adminCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };
    await updateWorkspaceMemberRole(adminCtx, {
      userId: memberId,
      role: "owner",
    });

    // Now downgrade original owner — should succeed because there's still another owner.
    await updateWorkspaceMemberRole(adminCtx, {
      userId: ownerId,
      role: "admin",
    });

    // Restore state for other tests
    await updateWorkspaceMemberRole(
      {
        actor: {
          type: "user",
          id: memberId,
          name: "M",
          email: "member@test.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      },
      { userId: ownerId, role: "owner" },
    );
    await updateWorkspaceMemberRole(adminCtx, {
      userId: memberId,
      role: "member",
    });
  });

  it("removeWorkspaceMember works for self-removal (non-owner)", async () => {
    // Add a temporary extra member to remove.
    const tempId = "2000000000000099";
    await db.insert(schema.workspaceMembers).values({
      workspaceId,
      userId: tempId,
      email: "temp@test.com",
      emailVerified: true,
      role: "member",
    });

    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: tempId,
        name: "Temp",
        email: "temp@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await removeWorkspaceMember(ctx, { userId: tempId });

    const remaining = await listWorkspaceMembers(
      {
        actor: {
          type: "user",
          id: memberId,
          name: "M",
          email: "m@test.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      },
      {},
    );
    expect(remaining.map((m) => m.userId)).not.toContain(tempId);

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.WORKSPACE_MEMBER_REMOVED),
          eq(schema.outbox.aggregateId, workspaceId),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.aggregateId).toBe(workspaceId);
    expect(event.actorId).toBe(tempId);
    expect(event.aggregateType).toBe(AggregateType.WORKSPACE);

    const payload = event.payload as WorkspaceMemberRemovedEvent["payload"];
    expect(payload.workspaceId).toBe(workspaceId);
    expect(payload.userId).toBe(tempId);
  });
});
