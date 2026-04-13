import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { idType } from "./types.ts";

export const outbox = pgTable(
  "outbox",
  {
    partitionKey: idType("partition_key").notNull(),
    id: idType("id").notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: idType("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.partitionKey, t.id] }),
    index("outbox_unpublished_idx")
      .on(t.id)
      .where(sql`published_at IS NULL`),
  ],
);

export const idSequences = pgTable(
  "id_sequences",
  {
    key1: idType("key1").notNull(),
    key2: idType("key2").notNull(),
    realm: varchar("realm", { length: 50 }).notNull(),
    lastTimestamp: bigint("last_timestamp", { mode: "bigint" }).notNull(),
    sequence: bigint("sequence", { mode: "bigint" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.key1, t.key2, t.realm] })],
);
