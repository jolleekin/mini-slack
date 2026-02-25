import {
  foreignKey,
  index,
  bigint,
  primaryKey,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { memberRoleEnum } from "./enums.ts";
import { workspaces } from "./workspaces.ts";

export const channels = pgTable(
  "channels",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" })
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    ownerId: bigint("owner_id", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const channelMembers = pgTable(
  "channel_members",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" }).notNull(),
    channelId: bigint("channel_id", { mode: "bigint" }).notNull(),
    userId: bigint("user_id", { mode: "bigint" }).notNull(),
    role: memberRoleEnum("role").notNull().default("member"),
    lastSeenMessageId: bigint("last_seen_message_id", { mode: "bigint" }),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.userId] }),
    foreignKey({
      columns: [t.workspaceId, t.channelId],
      foreignColumns: [channels.workspaceId, channels.id],
    }).onDelete("cascade"),
    index("channel_members_user_id_idx").on(t.workspaceId, t.userId),
  ],
);
