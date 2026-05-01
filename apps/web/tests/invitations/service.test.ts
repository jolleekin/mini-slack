import * as schema from "@mini-slack/db/index.ts";
import { ConflictError, NotFoundError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceMemberAddedEvent,
} from "@mini-slack/events/index.ts";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
} from "@/lib/messaging/workspaces/invitations/service.ts";
import { createTestDb } from "@/tests/helpers/db.ts";

describe("workspace invitations service", () => {
  let db: Db;
  const t = createTranslator(en);

  const workspaceId = "1000000000000002";
  const ownerId = "2000000000000010";
  const inviteeId = "2000000000000011";

  beforeAll(async () => {
    db = await createTestDb();

    // Seed workspace and owner.
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "Invite Workspace",
      slug: "invite-ws",
    });

    await db.insert(schema.workspaceMembers).values({
      workspaceId,
      userId: ownerId,
      email: "owner@test.com",
      emailVerified: true,
      role: "owner",
    });
  });

  it("createWorkspaceInvitation throws ConflictError on duplicate pending invitation", async () => {
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

    // First invite should succeed.
    await createWorkspaceInvitation(ctx, {
      email: "duplicate@test.com",
      role: "member",
    });

    // Second invite to same email should fail.
    await expect(
      createWorkspaceInvitation(ctx, {
        email: "duplicate@test.com",
        role: "member",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("acceptWorkspaceInvitation successfully adds member", async () => {
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

    // Create a fresh invitation.
    await createWorkspaceInvitation(ctx, {
      email: "newmember@test.com",
      role: "member",
    });

    // Fetch the invitation id.
    const [inv] = await db
      .select()
      .from(schema.workspaceInvitations)
      .where(eq(schema.workspaceInvitations.email, "newmember@test.com"));

    const acceptCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: inviteeId,
        name: "New Member",
        email: "newmember@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await acceptWorkspaceInvitation(acceptCtx, { invitationId: inv.id });

    // Verify member was added.
    const member = await db.query.workspaceMembers.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.workspaceId, workspaceId), eq(t.userId, inviteeId)),
    });
    expect(member).toBeDefined();
    expect(member!.role).toBe("member");

    // Verify invitation was marked accepted.
    const updated = await db.query.workspaceInvitations.findFirst({
      where: (t, { eq }) => eq(t.id, inv.id),
    });
    expect(updated!.status).toBe("accepted");

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.WORKSPACE_MEMBER_ADDED),
          eq(schema.outbox.aggregateId, workspaceId),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.aggregateId).toBe(workspaceId);
    expect(event.actorId).toBe(inviteeId);
    expect(event.aggregateType).toBe(AggregateType.WORKSPACE);

    const payload = event.payload as WorkspaceMemberAddedEvent["payload"];
    expect(payload.member.workspaceId).toBe(workspaceId);
    expect(payload.member.userId).toBe(inviteeId);
    expect(payload.member.role).toBe("member");
  });

  it("acceptWorkspaceInvitation throws NotFoundError for unknown invitation", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: inviteeId,
        name: "New Member",
        email: "newmember@test.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await expect(
      acceptWorkspaceInvitation(ctx, {
        invitationId: "9999999999999999",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
