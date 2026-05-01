import { PGlite } from "@electric-sql/pglite";
import * as schema from "@mini-slack/db/index.ts";
import { drizzle } from "drizzle-orm/pglite";
import fs from "node:fs";
import path from "node:path";

import { Db } from "@/lib/db.ts";

const migrationsDir = path.resolve(
  __dirname,
  "../../../../packages/db/migrations",
);

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((filename) => filename.endsWith(".sql"))
  .sort()
  .map((filename) => path.join(migrationsDir, filename));

/**
 * Creates an in-memory Postgres database (via PGlite) for testing service functions.
 * Manually runs each migration SQL file using PGlite's exec() API, which correctly
 * handles multi-statement files unlike the prepared-statement-based migrate() helper.
 */
export async function createTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  for (const path of migrations) {
    const sql = fs.readFileSync(path, "utf8");
    await client.exec(sql);
  }

  return db;
}
