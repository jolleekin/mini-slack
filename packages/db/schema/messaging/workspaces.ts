import {
  boolean,
  index,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { auditFields, createdAtField } from "../audit.ts";
import { idType } from "../types.ts";

import { invitationStatusEnum, workspaceMemberRoleEnum } from "./enums.ts";

export const workspaces = pgTable(
  "workspaces",
  {
    id: idType("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    logoUrl: varchar("logo_url", { length: 512 }),
    ...auditFields(),
  },
  (t) => [index("workspaces_slug_idx").on(t.slug)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: idType("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: idType("user_id").notNull(),
    role: workspaceMemberRoleEnum("role").notNull().default("member"),
    name: varchar("name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    ...auditFields(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index("workspace_members_user_id_idx").on(t.userId),
  ],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    workspaceId: idType("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: workspaceMemberRoleEnum("role").notNull().default("member"),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: idType("inviter_id").notNull(),
    createdAt: createdAtField(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    index("workspace_invitations_email_idx").on(t.email),
  ],
);
