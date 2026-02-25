import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  text,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const outbox = pgTable(
  "outbox",
  {
    partitionKey: bigint("partition_key", { mode: "bigint" }).notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: bigint("aggregate_id", { mode: "bigint" }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: text("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.partitionKey, t.id] }),
    index("outbox_unpublished_idx")
      .on(t.createdAt)
      .where(sql`published_at IS NULL`),
  ],
);
