import * as schema from "@mini-slack/db/index.ts";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  ChannelMemberAddedEvent,
  ChannelMemberRemovedEvent,
  EventType,
} from "@mini-slack/events/index.ts";
import { and, eq, sql } from "drizzle-orm";

import { WorkspaceServiceContext, requireUser } from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import { insertSystemMessage } from "../../messages/system.ts";
import { canManageWorkspace } from "../../workspaces/members/service.ts";

import {
  AddChannelMemberInput,
  ChannelMember,
  ChannelMemberRole,
  GetChannelMemberInput,
  GetChannelMemberOutput,
  ListChannelMembersInput,
  ListChannelMembersOutput,
  RemoveChannelMemberInput,
  RemoveChannelMemberOutput,
  UpdateChannelMemberLastSeenInput,
  UpdateChannelMemberLastSeenOutput,
  UpdateChannelMemberRoleInput,
  UpdateChannelMemberRoleOutput,
} from "./types.ts";

/**
 * Retrieves the role of a user in a specific channel.
 */
export async function getChannelMemberRole(
  ctx: WorkspaceServiceContext,
  input: { channelId: string; userId: string },
): Promise<ChannelMemberRole | undefined> {
  const { channelId, userId } = input;
  const [member] = await ctx.db
    .select({ role: schema.channelMembers.role })
    .from(schema.channelMembers)
    .where(
      and(
        eq(schema.channelMembers.workspaceId, ctx.workspaceId),
        eq(schema.channelMembers.channelId, channelId),
        eq(schema.channelMembers.userId, userId),
      ),
    )
    .limit(1);

  return member?.role;
}

/**
 * Checks if the current user can manage a channel (owner or workspace admin).
 */
export async function canManageChannel(
  ctx: WorkspaceServiceContext,
  input: { channelId: string },
): Promise<boolean> {
  const user = requireUser(ctx);

  const channelRole = await getChannelMemberRole(ctx, {
    channelId: input.channelId,
    userId: user.id,
  });

  if (channelRole === "owner") return true;

  return canManageWorkspace(ctx, input);
}

/**
 * Checks if a user can view a channel (member or workspace admin).
 */
export async function canViewChannel(
  ctx: WorkspaceServiceContext,
  input: { channelId: string },
): Promise<boolean> {
  const user = requireUser(ctx);

  const executorChannelRole = await getChannelMemberRole(ctx, {
    channelId: input.channelId,
    userId: user.id,
  });

  if (executorChannelRole) return true;

  return canManageWorkspace(ctx, input);
}

/**
 * Retrieves a specific channel member's details.
 *
 * Permission: Only channel members or workspace admins can view member details.
 */
export async function getChannelMember(
  ctx: WorkspaceServiceContext,
  input: GetChannelMemberInput,
): Promise<GetChannelMemberOutput> {
  const workspaceId = ctx.workspaceId;
  const { channelId, userId } = input;

  if (!(await canViewChannel(ctx, { channelId }))) {
    throw new ForbiddenError({ i18nKey: "channels.members.cant_view" });
  }

  const [member] = await ctx.db
    .select()
    .from(schema.channelMembers)
    .where(
      and(
        eq(schema.channelMembers.workspaceId, workspaceId),
        eq(schema.channelMembers.channelId, channelId),
        eq(schema.channelMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new NotFoundError({ i18nKey: "channels.members.not_found" });
  }

  return member;
}

/**
 * Lists all members of a channel.
 *
 * Permission: Only channel members or workspace admins can view member lists.
 */
export async function listChannelMembers(
  ctx: WorkspaceServiceContext,
  input: ListChannelMembersInput,
): Promise<ListChannelMembersOutput> {
  const workspaceId = ctx.workspaceId;
  const { channelId } = input;

  if (!(await canViewChannel(ctx, { channelId }))) {
    throw new ForbiddenError({ i18nKey: "channels.members.cant_view" });
  }

  return await ctx.db
    .select()
    .from(schema.channelMembers)
    .where(
      and(
        eq(schema.channelMembers.workspaceId, workspaceId),
        eq(schema.channelMembers.channelId, channelId),
      ),
    );
}

/**
 * Adds a member to a channel.
 *
 * Permission: Only channel owners or workspace admins/owners can add members.
 */
export async function addChannelMember(
  ctx: WorkspaceServiceContext,
  input: AddChannelMemberInput,
): Promise<ChannelMember> {
  const workspaceId = ctx.workspaceId;
  const { channelId, userId, role } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({ i18nKey: "channels.members.cant_add" });
    }

    const existingRole = await getChannelMemberRole(txCtx, {
      channelId,
      userId,
    });
    if (existingRole) {
      throw new ConflictError({ i18nKey: "channels.members.already_member" });
    }

    const [member] = await tx
      .insert(schema.channelMembers)
      .values({
        workspaceId,
        channelId,
        userId,
        role,
      })
      .returning();

    await publishEvent<ChannelMemberAddedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: channelId,
      aggregateType: AggregateType.CHANNEL,
      eventType: EventType.CHANNEL_MEMBER_ADDED,
      payload: {
        member,
      },
    });

    const [workspaceMember] = await tx
      .select({ name: schema.workspaceMembers.name })
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    await insertSystemMessage(txCtx, channelId, {
      type: "member_added",
      userId,
      name: workspaceMember?.name ?? "",
    });

    return member;
  });
}

/**
 * Updates a channel member's role.
 *
 * Permission: Only channel owners or workspace admins can update member roles.
 */
export async function updateChannelMemberRole(
  ctx: WorkspaceServiceContext,
  input: UpdateChannelMemberRoleInput,
): Promise<UpdateChannelMemberRoleOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, userId, role } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({
        i18nKey: "channels.members.cant_update",
      });
    }

    // Prevent owner downgrade if they are the last owner.
    if (userId === user.id && role !== "owner") {
      const owners = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.channelMembers)
        .where(
          and(
            eq(schema.channelMembers.workspaceId, workspaceId),
            eq(schema.channelMembers.channelId, channelId),
            eq(schema.channelMembers.role, "owner"),
          ),
        );

      if (Number(owners[0].count) <= 1) {
        throw new ConflictError({
          i18nKey: "channels.members.cant_downgrade_last_owner",
        });
      }
    }

    const [updatedMember] = await tx
      .update(schema.channelMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.channelMembers.workspaceId, workspaceId),
          eq(schema.channelMembers.channelId, channelId),
          eq(schema.channelMembers.userId, userId),
        ),
      )
      .returning();

    if (!updatedMember) {
      throw new NotFoundError({ i18nKey: "channels.members.not_found" });
    }

    return updatedMember;
  });
}

/**
 * Updates a channel member's last seen message.
 *
 * Permission: Only the user themselves can update their own last seen message.
 */
export async function updateChannelMemberLastSeenMessage(
  ctx: WorkspaceServiceContext,
  input: UpdateChannelMemberLastSeenInput,
): Promise<UpdateChannelMemberLastSeenOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, lastSeenMessageId } = input;

  const [updatedMember] = await ctx.db
    .update(schema.channelMembers)
    .set({
      lastSeenMessageId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.channelMembers.workspaceId, workspaceId),
        eq(schema.channelMembers.channelId, channelId),
        eq(schema.channelMembers.userId, user.id),
      ),
    )
    .returning();

  if (!updatedMember) {
    throw new NotFoundError({ i18nKey: "channels.members.not_found" });
  }

  return updatedMember;
}

/**
 * Removes a member from a channel.
 *
 * Permission: Only channel owners or workspace admins can remove members.
 */
export async function removeChannelMember(
  ctx: WorkspaceServiceContext,
  input: RemoveChannelMemberInput,
): Promise<RemoveChannelMemberOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, userId } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    // Allow self-removal; otherwise require channel owner or workspace admin.
    if (user.id !== userId && !(await canManageChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({
        i18nKey: "channels.members.cant_remove",
      });
    }

    // Snapshot the member's display name before deleting.
    const [workspaceMember] = await tx
      .select({ name: schema.workspaceMembers.name })
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    // Check if target is the last owner.
    const targetRole = await getChannelMemberRole(txCtx, { channelId, userId });
    if (targetRole === "owner") {
      const owners = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.channelMembers)
        .where(
          and(
            eq(schema.channelMembers.workspaceId, workspaceId),
            eq(schema.channelMembers.channelId, channelId),
            eq(schema.channelMembers.role, "owner"),
          ),
        );

      if (owners[0].count <= 1) {
        throw new ConflictError({
          i18nKey: "channels.members.cant_downgrade_last_owner",
        });
      }
    }

    // Remove the member.
    await tx
      .delete(schema.channelMembers)
      .where(
        and(
          eq(schema.channelMembers.workspaceId, workspaceId),
          eq(schema.channelMembers.channelId, channelId),
          eq(schema.channelMembers.userId, userId),
        ),
      );

    await publishEvent<ChannelMemberRemovedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: channelId,
      aggregateType: AggregateType.CHANNEL,
      eventType: EventType.CHANNEL_MEMBER_REMOVED,
      payload: {
        workspaceId,
        channelId,
        userId,
      },
    });

    await insertSystemMessage(txCtx, channelId, {
      type: user.id === userId ? "member_left" : "member_removed",
      userId,
      name: workspaceMember?.name ?? "",
    });

    return { id: userId };
  });
}
