import * as schema from "@mini-slack/db/index.ts";
import { ForbiddenError, NotFoundError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
} from "@mini-slack/events/index.ts";
import { createTranslator } from "@mini-slack/i18n/index.ts";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "@/lib/messaging/messages/service.ts";
import { createTestDb } from "@/tests/helpers/db.ts";

function createTestRichText(text: string) {
  return {
    root: {
      children: [
        {
          type: "paragraph" as const,
          children: [{ type: "text" as const, text }],
        },
      ],
    },
  };
}

describe("messages service (PGlite)", () => {
  let db: Db;
  const t = createTranslator(en);

  const workspaceId = "1000000000000010";
  const channelId = "3000000000000010";
  const ownerId = "2000000000000100";
  const authorId = "2000000000000101";
  const outsiderId = "2000000000000102";

  function createCtx(actor: {
    id: string;
    name: string;
    email: string;
  }): WorkspaceServiceContext {
    return {
      actor: {
        type: "user",
        id: actor.id,
        name: actor.name,
        email: actor.email,
        emailVerified: true,
      },
      db,
      workspaceId,
      t,
    };
  }

  beforeAll(async () => {
    db = await createTestDb();

    await db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "Messages Test Workspace",
      slug: "messages-test-ws",
    });

    await db.insert(schema.workspaceMembers).values([
      {
        workspaceId,
        userId: ownerId,
        email: "owner@messages.com",
        emailVerified: true,
        role: "owner",
        name: "Owner User",
        avatarUrl: null,
      },
      {
        workspaceId,
        userId: authorId,
        email: "author@messages.com",
        emailVerified: true,
        role: "member",
        name: "Author User",
        avatarUrl: null,
      },
      {
        workspaceId,
        userId: outsiderId,
        email: "outsider@messages.com",
        emailVerified: true,
        role: "member",
        name: "Outsider User",
        avatarUrl: null,
      },
    ]);

    await db.insert(schema.channels).values({
      id: channelId,
      workspaceId,
      name: "messages-test-channel",
      type: "public",
    });

    await db.insert(schema.channelMembers).values([
      {
        workspaceId,
        channelId,
        userId: ownerId,
        role: "owner",
      },
      {
        workspaceId,
        channelId,
        userId: authorId,
        role: "member",
      },
    ]);
  });

  it("createMessage persists the message and publishes an event", async () => {
    const ctx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });

    const result = await createMessage(ctx, {
      channelId,
      richText: createTestRichText("Hello from service test"),
      plainText: "Hello from service test",
    });

    const [persisted] = await db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, result.id),
        ),
      )
      .limit(1);

    expect(persisted).toBeDefined();
    expect(persisted.plainText).toBe("Hello from service test");
    expect(persisted.richText).toEqual(
      createTestRichText("Hello from service test"),
    );
    expect(persisted.authorId).toBe(authorId);
    expect(result.author).toEqual({
      id: authorId,
      name: "Author User",
      avatarUrl: null,
    });

    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.MESSAGE_CREATED),
          eq(schema.outbox.aggregateId, result.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(authorId);
    expect(event.aggregateType).toBe(AggregateType.MESSAGE);

    const payload = event.payload as MessageCreatedEvent["payload"];
    expect(payload.message.id).toBe(result.id);
    expect(payload.message.plainText).toBe("Hello from service test");
    expect(payload.author!.id).toBe(authorId);
    expect(payload.author!.name).toBe("Author User");
  });

  it("listMessages returns messages in descending order with pagination", async () => {
    const ctx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });

    await db.insert(schema.messages).values([
      {
        workspaceId,
        channelId,
        id: "1000000000000100",
        richText: createTestRichText("older message"),
        plainText: "older message",
        authorId,
      },
      {
        workspaceId,
        channelId,
        id: "1000000000000101",
        richText: createTestRichText("middle message"),
        plainText: "middle message",
        authorId,
      },
      {
        workspaceId,
        channelId,
        id: "1000000000000102",
        richText: createTestRichText("newer message"),
        plainText: "newer message",
        authorId,
      },
    ]);

    const messages = await listMessages(ctx, {
      channelId,
      before: "1000000000000102",
      limit: 2,
    });

    expect(messages).toHaveLength(2);
    expect(messages.map((message) => message.id)).toEqual([
      "1000000000000101",
      "1000000000000100",
    ]);
    expect(messages[0].author).toEqual({
      id: authorId,
      name: "Author User",
      avatarUrl: null,
    });
  });

  it("listMessages throws ForbiddenError for a non-member", async () => {
    const ctx = createCtx({
      id: outsiderId,
      name: "Outsider User",
      email: "outsider@messages.com",
    });

    await expect(listMessages(ctx, { channelId })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("updateMessage updates content for the author and publishes an event", async () => {
    const ctx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });

    const created = await createMessage(ctx, {
      channelId,
      richText: createTestRichText("Needs update"),
      plainText: "Needs update",
    });

    await updateMessage(ctx, {
      channelId,
      messageId: created.id,
      richText: createTestRichText("Updated content"),
      plainText: "Updated content",
    });

    const [updated] = await db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, created.id),
        ),
      )
      .limit(1);

    expect(updated).toBeDefined();
    expect(updated.plainText).toBe("Updated content");

    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.MESSAGE_UPDATED),
          eq(schema.outbox.aggregateId, created.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(authorId);

    const payload = event.payload as MessageUpdatedEvent["payload"];
    expect(payload.message.id).toBe(created.id);
    expect(payload.message.plainText).toBe("Updated content");
  });

  it("updateMessage throws NotFoundError for a missing message", async () => {
    const ctx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });

    await expect(
      updateMessage(ctx, {
        channelId,
        messageId: "9999999999999999",
        richText: createTestRichText("Nope"),
        plainText: "Nope",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deleteMessage allows the channel owner to remove another user's message", async () => {
    const authorCtx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });
    const ownerCtx = createCtx({
      id: ownerId,
      name: "Owner User",
      email: "owner@messages.com",
    });

    const created = await createMessage(authorCtx, {
      channelId,
      richText: createTestRichText("Delete me"),
      plainText: "Delete me",
    });

    await deleteMessage(ownerCtx, { channelId, messageId: created.id });

    const [deleted] = await db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.channelId, channelId),
          eq(schema.messages.id, created.id),
        ),
      )
      .limit(1);

    expect(deleted).toBeUndefined();

    const [event] = await db
      .select()
      .from(schema.outbox)
      .where(
        and(
          eq(schema.outbox.eventType, EventType.MESSAGE_DELETED),
          eq(schema.outbox.aggregateId, created.id),
        ),
      )
      .limit(1);

    expect(event).toBeDefined();
    expect(event.actorId).toBe(ownerId);

    const payload = event.payload as MessageDeletedEvent["payload"];
    expect(payload.workspaceId).toBe(workspaceId);
    expect(payload.channelId).toBe(channelId);
    expect(payload.id).toBe(created.id);
  });

  it("deleteMessage throws UnauthorizedError for a non-author who cannot manage the channel", async () => {
    const authorCtx = createCtx({
      id: authorId,
      name: "Author User",
      email: "author@messages.com",
    });
    const outsiderCtx = createCtx({
      id: outsiderId,
      name: "Outsider User",
      email: "outsider@messages.com",
    });

    const created = await createMessage(authorCtx, {
      channelId,
      richText: createTestRichText("Protected message"),
      plainText: "Protected message",
    });

    await expect(
      deleteMessage(outsiderCtx, { channelId, messageId: created.id }),
    ).rejects.toThrow(ForbiddenError);
  });
});
