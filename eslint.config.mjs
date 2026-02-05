import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/dist/**", "**/.next/**"]),
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
]);
