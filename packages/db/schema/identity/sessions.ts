import {
  index,
  bigint,
  primaryKey,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";

import { users } from "./users.ts";

export const sessions = pgTable(
  "sessions",
  {
    userId: bigint("user_id", { mode: "bigint" })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("sessions_token_idx").using("hash", t.token),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);
