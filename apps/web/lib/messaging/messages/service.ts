import * as schema from "@mini-slack/db/index.ts";
import { ForbiddenError, NotFoundError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
} from "@mini-slack/events/index.ts";
import { generateSequentialId } from "@mini-slack/id-gen/index.ts";
import { and, desc, eq, lt } from "drizzle-orm";

import { WorkspaceServiceContext, requireUser } from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import {
  canManageChannel,
  canViewChannel,
} from "../channels/members/service.ts";

import {
  CreateMessageInput,
  CreateMessageOutput,
  DeleteMessageInput,
  ListMessagesInput,
  ListMessagesOutput,
  MessageAuthor,
  UpdateMessageInput,
  UpdateMessageOutput,
} from "./types.ts";
import { wrapTextInAST } from "./utils.ts";

/**
 * Creates a message in a specific channel.
 */
export async function createMessage(
  ctx: WorkspaceServiceContext,
  input: CreateMessageInput,
): Promise<CreateMessageOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, plainText } = input;
  const richText = input.richText ?? wrapTextInAST(plainText);

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canViewChannel(txCtx, { channelId }))) {
      throw new ForbiddenError({
        i18nKey: "messages.cant_create",
      });
    }

    const id = await generateSequentialId(tx, channelId, "0", "messages");

    const [message] = await tx
      .insert(schema.messages)
      .values({
        workspaceId,
        channelId,
        id,
        richText,
        plainText,
        authorId: user.id,
      })
      .returning();

    const [author] = await tx
      .select({
        id: schema.workspaceMembers.userId,
        name: schema.workspaceMembers.name,
        avatarUrl: schema.workspaceMembers.avatarUrl,
      })
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, user.id),
        ),
      );

    await publishEvent<MessageCreatedEvent>(txCtx, {
      partitionKey: channelId,
      aggregateId: message.id,
      aggregateType: AggregateType.MESSAGE,
      eventType: EventType.MESSAGE_CREATED,
      payload: {
        message,
        author,
      },
    });

    return { ...message, author };
  });
}

/**
 * Lists messages for a specific channel with author information in descending
 * order of message ID.
 */
export async function listMessages(
  ctx: WorkspaceServiceContext,
  input: ListMessagesInput,
): Promise<ListMessagesOutput> {
  requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, before, limit: requestedLimit } = input;
  const txCtx = { ...ctx, db: ctx.db } as WorkspaceServiceContext;

  if (!(await canViewChannel(txCtx, { channelId }))) {
    throw new ForbiddenError({ i18nKey: "channels.cant_view" });
  }

  const limit = Math.min(requestedLimit ?? 50, 50);

  const rows = await ctx.db
    .select({
      workspaceId: schema.messages.workspaceId,
      channelId: schema.messages.channelId,
      type: schema.messages.type,
      authorId: schema.messages.authorId,
      id: schema.messages.id,
      richText: schema.messages.richText,
      plainText: schema.messages.plainText,
      metadata: schema.messages.metadata,
      createdAt: schema.messages.createdAt,
      updatedAt: schema.messages.updatedAt,
      author: {
        id: schema.workspaceMembers.userId,
        name: schema.workspaceMembers.name,
        avatarUrl: schema.workspaceMembers.avatarUrl,
      },
    })
    .from(schema.messages)
    .leftJoin(
      schema.workspaceMembers,
      and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.messages.authorId, schema.workspaceMembers.userId),
      ),
    )
    .where(
      and(
        eq(schema.messages.workspaceId, workspaceId),
        eq(schema.messages.channelId, channelId),
        before ? lt(schema.messages.id, before) : undefined,
      ),
    )
    .orderBy(desc(schema.messages.id))
    .limit(limit);

  return rows.map(({ author, ...msg }) => ({
    ...msg,
    author: author?.id ? (author as MessageAuthor) : null,
  }));
}

export async function updateMessage(
  ctx: WorkspaceServiceContext,
  input: UpdateMessageInput,
): Promise<UpdateMessageOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, messageId, plainText } = input;
  const richText = input.richText ?? wrapTextInAST(plainText);

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    const [message] = await tx
      .select({
        authorId: schema.messages.authorId,
      })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, messageId),
        ),
      );

    if (!message) {
      throw new NotFoundError({
        i18nKey: "messages.not_found",
        metadata: { messageId },
      });
    }

    if (message.authorId !== user.id) {
      throw new ForbiddenError({
        i18nKey: "messages.cant_update",
        metadata: { messageId },
      });
    }

    const [updatedMessage] = await tx
      .update(schema.messages)
      .set({ richText, plainText })
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, messageId),
        ),
      )
      .returning();

    await publishEvent<MessageUpdatedEvent>(txCtx, {
      partitionKey: channelId,
      aggregateId: messageId,
      aggregateType: AggregateType.MESSAGE,
      eventType: EventType.MESSAGE_UPDATED,
      payload: {
        message: updatedMessage,
      },
    });

    return updatedMessage;
  });
}

export async function deleteMessage(
  ctx: WorkspaceServiceContext,
  input: DeleteMessageInput,
): Promise<{ id: string }> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { channelId, messageId } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    const [message] = await tx
      .select({
        authorId: schema.messages.authorId,
      })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, messageId),
        ),
      );

    if (!message) {
      throw new NotFoundError({
        i18nKey: "messages.not_found",
        metadata: { messageId },
      });
    }

    if (message.authorId !== user.id) {
      if (!(await canManageChannel(txCtx, { channelId }))) {
        throw new ForbiddenError({
          i18nKey: "messages.cant_delete",
          metadata: { messageId },
        });
      }
    }

    const p1 = tx
      .delete(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, messageId),
        ),
      );

    const p2 = publishEvent<MessageDeletedEvent>(txCtx, {
      partitionKey: channelId,
      aggregateId: messageId,
      aggregateType: AggregateType.MESSAGE,
      eventType: EventType.MESSAGE_DELETED,
      payload: {
        workspaceId,
        channelId,
        id: messageId,
      },
    });

    await Promise.all([p1, p2]);

    return { id: messageId };
  });
}
