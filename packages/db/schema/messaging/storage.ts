import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  index,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";

import { fileStatusEnum } from "./enums.ts";
import { messages } from "./messages.ts";
import { workspaces } from "./workspaces.ts";

export const files = pgTable(
  "files",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" })
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    uploaderId: bigint("uploader_id", { mode: "bigint" }),
    url: varchar("url", { length: 512 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }),
    size: bigint("size", { mode: "bigint" }),
    status: fileStatusEnum("status").default("temporary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    index("files_uploader_id_idx").on(t.uploaderId),
  ],
);

export const messageFiles = pgTable(
  "message_files",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" }).notNull(),
    channelId: bigint("channel_id", { mode: "bigint" }).notNull(),
    messageId: bigint("message_id", { mode: "bigint" }).notNull(),
    fileId: bigint("file_id", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.workspaceId, t.channelId, t.messageId, t.fileId],
    }),
    foreignKey({
      columns: [t.workspaceId, t.fileId],
      foreignColumns: [files.workspaceId, files.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.workspaceId, t.channelId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.channelId, messages.id],
    }).onDelete("cascade"),
    index("message_files_channel_file_idx").on(
      t.workspaceId,
      t.channelId,
      t.createdAt.desc(),
    ),
  ],
);
