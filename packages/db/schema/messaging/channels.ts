import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { auditFields } from "../audit.ts";
import { idType } from "../types.ts";

import { channelTypeEnum, memberRoleEnum } from "./enums.ts";
import { workspaces } from "./workspaces.ts";

export const channels = pgTable(
  "channels",
  {
    workspaceId: idType("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: channelTypeEnum("type").notNull().default("public"),
    ...auditFields(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    uniqueIndex("channels_workspace_id_name_idx").on(t.workspaceId, t.name),
  ],
);

export const channelMembers = pgTable(
  "channel_members",
  {
    workspaceId: idType("workspace_id").notNull(),
    channelId: idType("channel_id").notNull(),
    userId: idType("user_id").notNull(),
    role: memberRoleEnum("role").notNull().default("member"),
    lastSeenMessageId: idType("last_seen_message_id"),
    ...auditFields(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.channelId, t.userId] }),
    foreignKey({
      name: "channel_members_workspace_id_channel_id_fk",
      columns: [t.workspaceId, t.channelId],
      foreignColumns: [channels.workspaceId, channels.id],
    }).onDelete("cascade"),
    index("channel_members_user_id_idx").on(t.workspaceId, t.userId),
  ],
);
