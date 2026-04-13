import {
  bigint,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { idType } from "../types.ts";

import { fileStatusEnum } from "./enums.ts";
import { messages } from "./messages.ts";
import { workspaces } from "./workspaces.ts";

export const files = pgTable(
  "files",
  {
    workspaceId: idType("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    uploaderId: idType("uploader_id"),
    url: varchar("url", { length: 512 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }),
    size: bigint("size", { mode: "number" }),
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
    workspaceId: idType("workspace_id").notNull(),
    channelId: idType("channel_id").notNull(),
    messageId: idType("message_id").notNull(),
    fileId: idType("file_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.workspaceId, t.channelId, t.messageId, t.fileId],
    }),
    foreignKey({
      name: "message_files_workspace_id_file_id_fk",
      columns: [t.workspaceId, t.fileId],
      foreignColumns: [files.workspaceId, files.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "message_files_workspace_id_channel_id_message_id_fk",
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
