import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better Auth instance.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
