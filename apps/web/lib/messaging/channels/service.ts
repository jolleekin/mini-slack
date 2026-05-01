import * as schema from "@mini-slack/db/index.ts";
import { ForbiddenError, NotFoundError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  ChannelCreatedEvent,
  ChannelDeletedEvent,
  ChannelUpdatedEvent,
  EventType,
} from "@mini-slack/events/index.ts";
import { generateRandomId } from "@mini-slack/id-gen/index.ts";
import { and, count, eq } from "drizzle-orm";

import { WorkspaceServiceContext, requireUser } from "@/lib/context.ts";
import { Tx } from "@/lib/db.ts";
import "@/lib/errors/i18n.ts";
import {
  mapUniqueViolationToConflict,
  publishEvent,
} from "@/lib/server-utils.ts";

import { insertSystemMessage } from "../messages/system.ts";

import { canManageChannel } from "./members/service.ts";
import {
  CreateChannelInput,
  CreateChannelOutput,
  DeleteChannelInput,
  DeleteChannelOutput,
  GetChannelInput,
  GetChannelOutput,
  ListChannelsInput,
  ListChannelsOutput,
  UpdateChannelInput,
  UpdateChannelOutput,
} from "./types.ts";

export async function createChannel_internal(
  ctx: WorkspaceServiceContext<Tx>,
  input: CreateChannelInput,
): Promise<CreateChannelOutput> {
  const { workspaceId } = ctx;
  const user = requireUser(ctx);
  const channelId = generateRandomId();

  try {
    const [channel] = await ctx.db
      .insert(schema.channels)
      .values({
        workspaceId,
        id: channelId,
        name: input.name,
        type: input.type,
      })
      .returning();

    await ctx.db.insert(schema.channelMembers).values({
      workspaceId,
      channelId,
      userId: user.id,
      role: "owner",
    });

    await publishEvent<ChannelCreatedEvent>(ctx, {
      partitionKey: workspaceId,
      aggregateId: channelId,
      aggregateType: AggregateType.CHANNEL,
      eventType: EventType.CHANNEL_CREATED,
      payload: {
        channel,
      },
    });

    return channel;
  } catch (error) {
    mapUniqueViolationToConflict(error, {
      i18nKey: "channels.name_taken",
      metadata: { name: input.name },
    });
  }
}

export async function createChannel(
  ctx: WorkspaceServiceContext,
  input: CreateChannelInput,
): Promise<CreateChannelOutput> {
  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    return await createChannel_internal(txCtx, input);
  });
}

export async function getChannel(
  ctx: WorkspaceServiceContext,
  input: GetChannelInput,
): Promise<GetChannelOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId } = input;

  const result = await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    const [memberCount] = await txCtx.db
      .select({ count: count(schema.channelMembers.userId) })
      .from(schema.channelMembers)
      .where(
        and(
          eq(schema.channelMembers.workspaceId, workspaceId),
          eq(schema.channelMembers.channelId, channelId),
        ),
      );

    if (!memberCount) {
      throw new NotFoundError({
        i18nKey: "channels.not_found",
        metadata: { channelId },
      });
    }

    const [channelWithRole] = await txCtx.db
      .select({
        workspaceId: schema.channels.workspaceId,
        id: schema.channels.id,
        name: schema.channels.name,
        type: schema.channels.type,
        createdAt: schema.channels.createdAt,
        updatedAt: schema.channels.updatedAt,
        role: schema.channelMembers.role,
      })
      .from(schema.channels)
      .leftJoin(
        schema.channelMembers,
        eq(schema.channels.id, schema.channelMembers.channelId),
      )
      .where(
        and(
          eq(schema.channels.workspaceId, workspaceId),
          eq(schema.channels.id, channelId),
          eq(schema.channelMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (
      !channelWithRole ||
      (channelWithRole.type === "private" && !channelWithRole.role)
    ) {
      throw new NotFoundError({
        i18nKey: "channels.not_found",
        metadata: { channelId },
      });
    }

    channelWithRole.role ??= "member"; // For public channel.

    return { ...channelWithRole, memberCount: memberCount?.count };
  });

  return result;
}

/**
 * Lists all channels in a workspace that a specific user belongs to.
 *
 * @param ctx - ServiceContext with workspace membership validated by middleware
 */
export async function listChannels(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: ListChannelsInput,
): Promise<ListChannelsOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    const publicChannels = await txCtx.db
      .select({
        workspaceId: schema.channels.workspaceId,
        id: schema.channels.id,
        name: schema.channels.name,
        type: schema.channels.type,
        createdAt: schema.channels.createdAt,
        updatedAt: schema.channels.updatedAt,
        role: schema.channelMembers.role,
      })
      .from(schema.channels)
      .leftJoin(
        schema.channelMembers,
        and(
          eq(schema.channelMembers.workspaceId, schema.channels.workspaceId),
          eq(schema.channelMembers.channelId, schema.channels.id),
          eq(schema.channelMembers.userId, user.id),
        ),
      )
      .where(
        and(
          eq(schema.channels.workspaceId, workspaceId),
          eq(schema.channels.type, "public"),
        ),
      );

    const privateChannels = await txCtx.db
      .select({
        workspaceId: schema.channels.workspaceId,
        id: schema.channels.id,
        name: schema.channels.name,
        type: schema.channels.type,
        createdAt: schema.channels.createdAt,
        updatedAt: schema.channels.updatedAt,
        role: schema.channelMembers.role,
      })
      .from(schema.channels)
      .innerJoin(
        schema.channelMembers,
        and(
          eq(schema.channelMembers.workspaceId, schema.channels.workspaceId),
          eq(schema.channelMembers.channelId, schema.channels.id),
          eq(schema.channelMembers.userId, user.id),
        ),
      )
      .where(
        and(
          eq(schema.channels.workspaceId, workspaceId),
          eq(schema.channels.type, "private"),
        ),
      );

    return [...publicChannels, ...privateChannels];
  });
}

export async function updateChannel(
  ctx: WorkspaceServiceContext,
  input: UpdateChannelInput,
): Promise<UpdateChannelOutput> {
  const workspaceId = ctx.workspaceId;
  const { channelId, ...updates } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({
        i18nKey: "channels.cant_update",
      });
    }

    // Snapshot current name before the update so we can emit a rename event.
    let oldName: string | undefined;
    if (updates.name) {
      const [current] = await txCtx.db
        .select({ name: schema.channels.name })
        .from(schema.channels)
        .where(
          and(
            eq(schema.channels.workspaceId, workspaceId),
            eq(schema.channels.id, channelId),
          ),
        )
        .limit(1);
      oldName = current?.name;
    }

    try {
      const [updatedChannel] = await txCtx.db
        .update(schema.channels)
        .set(updates)
        .where(
          and(
            eq(schema.channels.workspaceId, workspaceId),
            eq(schema.channels.id, channelId),
          ),
        )
        .returning();

      await publishEvent<ChannelUpdatedEvent>(txCtx, {
        partitionKey: workspaceId,
        aggregateId: channelId,
        aggregateType: AggregateType.CHANNEL,
        eventType: EventType.CHANNEL_UPDATED,
        payload: {
          channel: updatedChannel,
        },
      });

      if (updates.name && oldName && updates.name !== oldName) {
        await insertSystemMessage(txCtx, channelId, {
          type: "channel_renamed",
          oldName,
          newName: updates.name,
        });
      }

      return updatedChannel;
    } catch (error) {
      mapUniqueViolationToConflict(error, {
        i18nKey: "channels.name_taken",
        metadata: { name: updates.name! },
      });
    }
  });
}

export async function deleteChannel(
  ctx: WorkspaceServiceContext,
  input: DeleteChannelInput,
): Promise<DeleteChannelOutput> {
  const workspaceId = ctx.workspaceId;
  const { channelId } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({
        i18nKey: "channels.cant_delete",
      });
    }

    const p1 = tx
      .delete(schema.channelMembers)
      .where(
        and(
          eq(schema.channelMembers.workspaceId, workspaceId),
          eq(schema.channelMembers.channelId, channelId),
        ),
      );
    const p2 = tx
      .delete(schema.channels)
      .where(
        and(
          eq(schema.channels.workspaceId, workspaceId),
          eq(schema.channels.id, channelId),
        ),
      );

    const p3 = publishEvent<ChannelDeletedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: channelId,
      aggregateType: AggregateType.CHANNEL,
      eventType: EventType.CHANNEL_DELETED,
      payload: {
        workspaceId,
        channelId,
      },
    });

    await Promise.all([p1, p2, p3]);

    return { id: channelId };
  });
}
