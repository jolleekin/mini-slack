import {
  pgTable,
  bigint,
  varchar,
  boolean,
  timestamp,
  text,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

import { users } from "./users.ts";

export const verifications = pgTable(
  "verifications",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier, t.value)],
);

export const passkeys = pgTable(
  "passkeys",
  {
    userId: bigint("user_id", { mode: "bigint" })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    name: varchar("name", { length: 255 }),
    publicKey: text("public_key").notNull(),
    credentialId: text("credential_id").notNull(),
    counter: bigint("counter", { mode: "bigint" }).notNull(),
    deviceType: varchar("device_type", { length: 50 }).notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const twoFactors = pgTable(
  "two_factors",
  {
    userId: bigint("user_id", { mode: "bigint" })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: bigint("id", { mode: "bigint" }).notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);
