import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { auditFields, createdAtField } from "../audit.ts";
import { idType } from "../types.ts";

import { users } from "./users.ts";

export const verifications = pgTable(
  "verifications",
  {
    id: idType("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...auditFields(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier, t.value)],
);

export const passkeys = pgTable(
  "passkeys",
  {
    userId: idType("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    name: varchar("name", { length: 255 }),
    publicKey: text("public_key").notNull(),
    credentialId: text("credential_id").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull(),
    deviceType: varchar("device_type", { length: 50 }).notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: createdAtField(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const twoFactors = pgTable(
  "two_factors",
  {
    userId: idType("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: idType("id").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    ...auditFields(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);
