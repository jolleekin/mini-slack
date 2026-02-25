import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  text,
  index,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";

import { channels } from "./channels.ts";

export const messages = pgTable(
  "messages",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" }).notNull(),
    channelId: bigint("channel_id", { mode: "bigint" }).notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    content: text("content").notNull(),
    authorId: bigint("author_id", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.id] }),
    foreignKey({
      columns: [t.workspaceId, t.channelId],
      foreignColumns: [channels.workspaceId, channels.id],
    }).onDelete("cascade"),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" }).notNull(),
    channelId: bigint("channel_id", { mode: "bigint" }).notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    messageId: bigint("message_id", { mode: "bigint" }).notNull(),
    userId: bigint("user_id", { mode: "bigint" }).notNull(),
    emoji: varchar("emoji", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.id] }),
    foreignKey({
      columns: [t.workspaceId, t.channelId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.channelId, messages.id],
    }).onDelete("cascade"),
    index("reactions_message_idx").on(t.workspaceId, t.channelId, t.messageId),
  ],
);
