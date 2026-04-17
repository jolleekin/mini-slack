import { boolean, index, pgTable, varchar } from "drizzle-orm/pg-core";

import { auditFields } from "../audit.ts";
import { idType } from "../types.ts";

export const users = pgTable(
  "users",
  {
    id: idType("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: boolean("email_verified").default(false),
    ...auditFields(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);
