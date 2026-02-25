import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
