import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/identity/auth.ts";

/**
 * Route handler for all Better Auth requests.
 */
export const { GET, POST } = toNextJsHandler(auth);
