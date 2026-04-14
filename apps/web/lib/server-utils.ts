import { outbox } from "@mini-slack/db/schema/infrastructure.ts";
import { AppEvent } from "@mini-slack/events/index.ts";
import { generateSequentialId } from "@mini-slack/id-gen/index.ts";
import "server-only";

import { Tx } from "@/lib/db";

/**
 * Publishes an event to the Transactional Outbox within an existing transaction.
 */
export async function publishEvent<T extends AppEvent>(
  tx: Tx,
  event: Pick<
    T,
    "partitionKey" | "aggregateId" | "aggregateType" | "eventType" | "payload"
  >,
): Promise<void> {
  const eventId = await generateSequentialId(
    tx,
    event.partitionKey,
    "0",
    "outbox",
  );

  await tx.insert(outbox).values({
    ...event,
    id: eventId,
  });
}
