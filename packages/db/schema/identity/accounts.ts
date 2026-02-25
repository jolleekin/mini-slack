import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  text,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const accounts = pgTable(
  "accounts",
  {
    userId: bigint("user_id", { mode: "bigint" })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("provider_id_acount_id_idx").on(t.providerId, t.providerAccountId),
  ],
);
