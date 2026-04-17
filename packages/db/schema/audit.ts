import { timestamp } from "drizzle-orm/pg-core";

const withTimezone = { withTimezone: true } as const;

export function createdAtField() {
  return timestamp("created_at", withTimezone).notNull().defaultNow();
}

export function auditFields() {
  return {
    createdAt: createdAtField(),
    updatedAt: timestamp("updated_at", withTimezone)
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  };
}
