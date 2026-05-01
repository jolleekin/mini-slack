import { outbox } from "@mini-slack/db/schema/infrastructure.ts";
import { AppErrorOptions, ConflictError } from "@mini-slack/errors/index.ts";
import { AppEvent } from "@mini-slack/events/index.ts";
import { generateSequentialId } from "@mini-slack/id-gen/index.ts";
import { DrizzleQueryError } from "drizzle-orm";
import "server-only";

import { ServiceContext } from "./context.ts";
import { Tx } from "./db.ts";

export function mapUniqueViolationToConflict(
  error: unknown,
  options: AppErrorOptions,
): never {
  const isUniqueViolation =
    (error instanceof DrizzleQueryError &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.cause as any)?.code === "23505") ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any)?.code === "23505";

  if (isUniqueViolation) {
    throw new ConflictError(options);
  }
  throw error;
}

export async function publishEvent<T extends AppEvent>(
  ctx: ServiceContext<Tx>,
  event: Pick<
    T,
    "partitionKey" | "aggregateId" | "aggregateType" | "eventType" | "payload"
  >,
): Promise<void> {
  const eventId = await generateSequentialId(
    ctx.db,
    event.partitionKey,
    "0",
    "outbox",
  );
  const evt = { ...event, id: eventId, actorId: ctx.actor.id };

  await ctx.db.insert(outbox).values(evt);
}
