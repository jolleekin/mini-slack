import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { auditFields } from "../audit.ts";
import { idType } from "../types.ts";

import { users } from "./users.ts";

export const sessions = pgTable(
  "sessions",
  {
    userId: idType("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    ...auditFields(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("sessions_token_idx").using("hash", t.token),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);
