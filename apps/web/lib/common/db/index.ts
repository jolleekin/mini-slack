import * as schema from "@mini-slack/db";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Recommended for some serverless environments/poolers
});

export const db = drizzle(client, { schema });
