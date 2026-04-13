import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { idType } from "../types.ts";

import { channels } from "./channels.ts";

export const messages = pgTable(
  "messages",
  {
    workspaceId: idType("workspace_id").notNull(),
    channelId: idType("channel_id").notNull(),
    id: idType("id").notNull(),
    content: text("content").notNull(),
    authorId: idType("author_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.id] }),
    foreignKey({
      name: "messages_workspace_id_channel_id_fk",
      columns: [t.workspaceId, t.channelId],
      foreignColumns: [channels.workspaceId, channels.id],
    }).onDelete("cascade"),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    workspaceId: idType("workspace_id").notNull(),
    channelId: idType("channel_id").notNull(),
    id: idType("id").notNull(),
    messageId: idType("message_id").notNull(),
    userId: idType("user_id").notNull(),
    emoji: varchar("emoji", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.id] }),
    foreignKey({
      name: "reactions_workspace_id_channel_id_message_id_fk",
      columns: [t.workspaceId, t.channelId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.channelId, messages.id],
    }).onDelete("cascade"),
    index("reactions_message_idx").on(t.workspaceId, t.channelId, t.messageId),
  ],
);
