import * as schema from "@mini-slack/db/index.ts";
import { ConflictError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  ChannelMemberAddedEvent,
  ChannelMemberRemovedEvent,
  EventType,
} from "@mini-slack/events/index.ts";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  addChannelMember,
  getChannelMember,
  listChannelMembers,
  removeChannelMember,
  updateChannelMemberLastSeenMessage,
  updateChannelMemberRole,
} from "@/lib/messaging/channels/members/service.ts";
import { createTestDb } from "@/tests/helpers/db";

describe("channel members service (PGlite)", () => {
  let db: Db;
  const t = createTranslator(en);

  const workspaceId = "1000000000000004";
  const channelId = "3000000000000001";
  const channelOwnerId = "2000000000000030";
  const newMemberId = "2000000000000031";
  const anotherMemberId = "2000000000000032";

  beforeAll(async () => {
    db = await createTestDb();

    // Seed workspace
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "Channel Members Test Workspace",
      slug: "channel-members-test-ws",
    });

    // Seed users into workspace
    await db.insert(schema.workspaceMembers).values([
      {
        workspaceId,
        userId: channelOwnerId,
        email: "owner@channels.com",
        emailVerified: true,
        role: "owner", // User is workspace owner too
      },
      {
        workspaceId,
        userId: newMemberId,
        email: "member1@channels.com",
        emailVerified: true,
        role: "member",
      },
      {
        workspaceId,
        userId: anotherMemberId,
        email: "member2@channels.com",
        emailVerified: true,
        role: "member",
      },
    ]);

    // Seed the channel itself directly manually rather than using service, to hardcode channelId
    await db.insert(schema.channels).values({
      id: channelId,
      workspaceId,
      name: "test-channel",
      type: "public",
    });

    // Make channelOwnerId the owner of the channel
    await db.insert(schema.channelMembers).values({
      workspaceId,
      channelId,
      userId: channelOwnerId,
      role: "owner",
    });
  });

  describe("addChannelMember", () => {
    it("successfully adds a new member and publishes an event", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: channelOwnerId,
          name: "Owner",
          email: "owner@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };

      await addChannelMember(ctx, {
        channelId,
        userId: newMemberId,
        role: "member",
      });

      const member = await getChannelMember(ctx, {
        channelId,
        userId: newMemberId,
      });
      expect(member).toBeDefined();
      expect(member!.role).toBe("member");

      // Verify event
      const [event] = await db
        .select()
        .from(schema.outbox)
        .where(
          and(
            eq(schema.outbox.eventType, EventType.CHANNEL_MEMBER_ADDED),
            eq(schema.outbox.aggregateId, channelId),
          ),
        )
        .limit(1);

      expect(event).toBeDefined();
      expect(event.aggregateType).toBe(AggregateType.CHANNEL);
      expect(event.actorId).toBe(channelOwnerId);

      const payload = event.payload as ChannelMemberAddedEvent["payload"];
      expect(payload.member.workspaceId).toBe(workspaceId);
      expect(payload.member.channelId).toBe(channelId);
      expect(payload.member.userId).toBe(newMemberId);
      expect(payload.member.role).toBe("member");
    });
  });

  describe("listChannelMembers", () => {
    it("returns correct list of members", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: channelOwnerId,
          name: "Owner",
          email: "owner@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };
      const members = await listChannelMembers(ctx, { channelId });
      expect(members.length).toBe(2);
      expect(members.map((m) => m.userId).sort()).toEqual(
        [channelOwnerId, newMemberId].sort(),
      );
    });
  });

  describe("updateChannelMemberRole", () => {
    it("prevents downgrading the last owner", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: channelOwnerId,
          name: "Owner",
          email: "owner@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };

      await expect(
        updateChannelMemberRole(ctx, {
          channelId,
          userId: channelOwnerId,
          role: "member",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("succeeds for valid role updates", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: channelOwnerId,
          name: "Owner",
          email: "owner@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };

      // Promote newMember to owner
      await updateChannelMemberRole(ctx, {
        channelId,
        userId: newMemberId,
        role: "owner",
      });

      const member = await getChannelMember(ctx, {
        channelId,
        userId: newMemberId,
      });
      expect(member!.role).toBe("owner");
    });
  });

  describe("updateChannelMemberLastSeenMessage", () => {
    it("updates last seen message successfully for self", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: newMemberId,
          name: "Member1",
          email: "member1@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };

      const messageId = "1000000000000123";
      await updateChannelMemberLastSeenMessage(ctx, {
        channelId,
        lastSeenMessageId: messageId,
      });

      const member = await getChannelMember(ctx, {
        channelId,
        userId: newMemberId,
      });
      expect(member!.lastSeenMessageId).toBe(messageId);
    });
  });

  describe("removeChannelMember", () => {
    it("removes a member from the channel and publishes an event", async () => {
      const ctx: WorkspaceServiceContext = {
        actor: {
          type: "user",
          id: channelOwnerId,
          name: "Owner",
          email: "owner@channels.com",
          emailVerified: true,
        },
        db,
        workspaceId,
        t,
      };

      await removeChannelMember(ctx, { channelId, userId: newMemberId });

      // Verify removed
      const members = await listChannelMembers(ctx, { channelId });
      expect(members.length).toBe(1);
      expect(members[0].userId).toBe(channelOwnerId);

      // Verify event
      const [event] = await db
        .select()
        .from(schema.outbox)
        .where(
          and(
            eq(schema.outbox.eventType, EventType.CHANNEL_MEMBER_REMOVED),
            eq(schema.outbox.aggregateId, channelId),
          ),
        )
        .limit(1);

      expect(event).toBeDefined();
      expect(event.aggregateType).toBe(AggregateType.CHANNEL);
      expect(event.actorId).toBe(channelOwnerId);

      const payload = event.payload as ChannelMemberRemovedEvent["payload"];
      expect(payload.workspaceId).toBe(workspaceId);
      expect(payload.channelId).toBe(channelId);
      expect(payload.userId).toBe(newMemberId);
    });
  });
});
