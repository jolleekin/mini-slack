import * as schema from "@mini-slack/db/index.ts";
import {
  AggregateType,
  EventType,
  MessageCreatedEvent,
} from "@mini-slack/events/index.ts";
import { generateSequentialId } from "@mini-slack/id-gen/index.ts";

import { WorkspaceServiceContext } from "@/lib/context.ts";
import { Tx } from "@/lib/db.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import { SystemMessageInput } from "./types.ts";
import { wrapTextInAST } from "./utils.ts";

/**
 * Inserts a system message into a channel within the given transaction context
 * and publishes a MESSAGE_CREATED event for real-time delivery.
 *
 * System messages have no author and carry structured metadata so clients can
 * render localized strings (e.g. "Alice was added to the channel").
 */
export async function insertSystemMessage(
  txCtx: WorkspaceServiceContext<Tx>,
  channelId: string,
  input: SystemMessageInput,
): Promise<void> {
  const id = await generateSequentialId(txCtx.db, channelId, "0", "messages");
  const { type, ...metadata } = input;

  const [message] = await txCtx.db
    .insert(schema.messages)
    .values({
      workspaceId: txCtx.workspaceId,
      channelId,
      id,
      type,
      metadata,
      richText: wrapTextInAST(""),
      plainText: "",
    })
    .returning();

  await publishEvent<MessageCreatedEvent>(txCtx, {
    partitionKey: channelId,
    aggregateId: message.id,
    aggregateType: AggregateType.MESSAGE,
    eventType: EventType.MESSAGE_CREATED,
    payload: {
      message,
      author: null,
    },
  });
}
