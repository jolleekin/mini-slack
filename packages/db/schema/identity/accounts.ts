import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { idType } from "../types.ts";

import { users } from "./users.ts";

export const accounts = pgTable(
  "accounts",
  {
    userId: idType("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    providerId: varchar("provider_id", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"), // used when providerId is "credentials".
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    uniqueIndex("provider_id_acount_id_idx").on(
      t.providerId,
      t.providerAccountId,
    ),
  ],
);
type X = typeof accounts.$inferSelect;
