import * as schema from "@mini-slack/db/index.ts";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  ChannelCreatedEvent,
  ChannelDeletedEvent,
  ChannelUpdatedEvent,
  EventType,
} from "@mini-slack/events/index.ts";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  createChannel,
  deleteChannel,
  getChannel,
  listChannels,
  updateChannel,
} from "@/lib/messaging/channels/service.ts";
import { createTestDb } from "@/tests/helpers/db.ts";

describe("channels service (PGlite)", () => {
  let db: Db;
  const t = createTranslator(en);

  const workspaceId = "1000000000000003";
  const ownerId = "2000000000000020";
  const memberId = "2000000000000021";

  beforeAll(async () => {
    db = await createTestDb();

    // Seed workspace.
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "Channels Test Workspace",
      slug: "channels-test-ws",
    });

    // Seed users into workspace.
    await db.insert(schema.workspaceMembers).values([
      {
        workspaceId,
        userId: ownerId,
        email: "owner@channels.com",
        emailVerified: true,
        role: "owner",
      },
      {
        workspaceId,
        userId: memberId,
        email: "member@channels.com",
        emailVerified: true,
        role: "member",
      },
    ]);
  });

  it("createChannel successfully creates a channel and adds creator as owner", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const input = {
      name: "general",
      type: "public" as const,
    };

    const channel = await createChannel(ctx, input);

    expect(channel).toBeDefined();
    expect(channel.name).toBe("general");

    // Verify channel member was correctly assigned owner role.
    const member = await db.query.channelMembers.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.workspaceId, workspaceId),
          eq(t.channelId, channel.id),
          eq(t.userId, ownerId),
        ),
    });

    expect(member).toBeDefined();
    expect(member!.role).toBe("owner");

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.CHANNEL_CREATED),
          eq(schema.outbox.aggregateId, channel.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(ownerId);
    expect(event.aggregateType).toBe(AggregateType.CHANNEL);

    const payload = event.payload as ChannelCreatedEvent["payload"];
    expect(payload.channel.id).toBe(channel.id);
    expect(payload.channel.name).toBe(input.name);
  });

  it("createChannel throws ConflictError on duplicate channel name", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const input = {
      name: "general", // Already created in previous test.
      type: "public" as const,
    };

    await expect(createChannel(ctx, input)).rejects.toThrow(ConflictError);
  });

  it("listChannels returns public channels and private channels the user is a member of", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    // Create a private channel.
    await createChannel(ctx, { name: "secret", type: "private" });

    const channels = await listChannels(ctx, {});

    // Should return "general" and "secret".
    expect(channels.length).toBeGreaterThanOrEqual(2);
    const names = channels.map((c) => c.name);
    expect(names).toContain("general");
    expect(names).toContain("secret");
  });

  it("listChannels hides private channels the user is not a member of", async () => {
    const memberCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: memberId,
        name: "Member",
        email: "member@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const channels = await listChannels(memberCtx, {});

    const names = channels.map((c) => c.name);
    expect(names).toContain("general"); // Member can see public channels.
    expect(names).not.toContain("secret"); // But not the private channel created by owner.
  });

  it("getChannel returns channel details with user role for channel members", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const created = await createChannel(ctx, {
      name: "get-channel-test",
      type: "public",
    });

    const channel = await getChannel(ctx, { channelId: created.id });

    expect(channel).toBeDefined();
    expect(channel.id).toBe(created.id);
    expect(channel.name).toBe("get-channel-test");
    expect(channel.type).toBe("public");
    expect(channel.role).toBe("owner");
    expect(channel.memberCount).toBeGreaterThanOrEqual(1);
  });

  it("getChannel throws NotFoundError for non-existent channel", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await expect(
      getChannel(ctx, { channelId: "9999999999999999" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("getChannel throws NotFoundError for non-member user", async () => {
    const ownerCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const channel = await createChannel(ownerCtx, {
      name: "private-channel",
      type: "private",
    });

    const memberCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: memberId,
        name: "Member",
        email: "member@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    // memberId is not a member of the private channel, so should get an error
    await expect(
      getChannel(memberCtx, { channelId: channel.id }),
    ).rejects.toThrow(NotFoundError);
  });

  it("updateChannel updates channel name for authorized user", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const channel = await createChannel(ctx, {
      name: "rename-me",
      type: "public",
    });

    await updateChannel(ctx, { channelId: channel.id, name: "renamed" });

    const updated = await db.query.channels.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.workspaceId, workspaceId), eq(t.id, channel.id)),
    });

    expect(updated!.name).toBe("renamed");

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.CHANNEL_UPDATED),
          eq(schema.outbox.aggregateId, channel.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(ownerId);
    const payload = event.payload as ChannelUpdatedEvent["payload"];
    expect(payload.channel.name).toBe("renamed");
  });

  it("updateChannel throws UnauthorizedError for non-channel-owners", async () => {
    // Note: workspace owners can update channels even if not channel owners, but let's test a regular user.
    const ownerCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const channel = await createChannel(ownerCtx, {
      name: "cant-touch-this",
      type: "public",
    });

    // Since memberId is a workspace "member" (not admin/owner), they shouldn't be able to rename a channel they don't own.
    const memberCtx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: memberId,
        name: "Member",
        email: "member@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    await expect(
      updateChannel(memberCtx, { channelId: channel.id, name: "hacked" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deleteChannel removes channel successfully", async () => {
    const ctx: WorkspaceServiceContext = {
      actor: {
        type: "user",
        id: ownerId,
        name: "Owner",
        email: "owner@channels.com",
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };

    const channel = await createChannel(ctx, {
      name: "delete-me",
      type: "public",
    });
    await deleteChannel(ctx, { channelId: channel.id });

    const deleted = await db.query.channels.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.workspaceId, workspaceId), eq(t.id, channel.id)),
    });

    expect(deleted).toBeUndefined();

    // Verify outbox event.
    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.CHANNEL_DELETED),
          eq(schema.outbox.aggregateId, channel.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(ownerId);
    const payload = event.payload as ChannelDeletedEvent["payload"];
    expect(payload.channelId).toBe(channel.id);
    expect(payload.workspaceId).toBe(workspaceId);
  });
});
