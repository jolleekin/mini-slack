import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

import { memberRoleEnum, invitationStatusEnum } from "./enums.ts";

export const workspaces = pgTable(
  "workspaces",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    logoUrl: varchar("logo_url", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("workspaces_slug_idx").on(t.slug)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" })
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: bigint("user_id", { mode: "bigint" }).notNull(),
    role: memberRoleEnum("role").notNull().default("member"),
    displayName: varchar("display_name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index("workspace_members_user_id_idx").on(t.userId),
  ],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    workspaceId: bigint("workspace_id", { mode: "bigint" })
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: memberRoleEnum("role").default("member"),
    status: invitationStatusEnum("status").default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: bigint("inviter_id", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    index("workspace_invitations_email_idx").on(t.email),
  ],
);
