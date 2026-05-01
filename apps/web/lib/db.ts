import * as schema from "@mini-slack/db";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgDatabase, PgTransaction } from "drizzle-orm/pg-core";
import { PgliteDatabase, PgliteTransaction } from "drizzle-orm/pglite";
import { PostgresJsQueryResultHKT, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Recommended for some serverless environments/poolers
});

export const db = drizzle(client, { schema });

/**
 * Either the {@linkcode db} singleton or a transaction created from it.
 */
export type Db =
  | PgDatabase<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | PgliteDatabase<typeof schema>;

/**
 * A DB transaction.
 */
export type Tx =
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | PgliteTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;
