import { createORPCClient } from "@orpc/client";
import { LinkFetchClientOptions, RPCLink } from "@orpc/client/fetch";
import type { ClientContext, RouterClient } from "@orpc/server";

import type { RPCRouter } from "./routers/index.ts";

/**
 * Creates an oRPC client.
 * @param baseUrl The base URL for the API (e.g., http://localhost:3000/api/rpc)
 * @param fetch The fetch implementation to use
 */
export function createClient(
  baseUrl: string,
  fetch?: LinkFetchClientOptions<ClientContext>["fetch"],
): RouterClient<RPCRouter> {
  const link = new RPCLink({ url: baseUrl, fetch });
  return createORPCClient<RouterClient<RPCRouter>>(link);
}
