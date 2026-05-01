import { RouterClient } from "@orpc/server";
import { NextRequest } from "next/server";
import { vi } from "vitest";

import { WORKSPACE_ID_HEADER } from "@/lib/constants.ts";
import { auth } from "@/lib/identity/auth.ts";
import { createClient } from "@/lib/rpc/client.ts";
import { RPCRouter } from "@/lib/rpc/routers";

vi.mock("@/lib/rpc/get-workspace-member-role.ts", () => ({
  getWorkspaceMemberRole: () => "owner",
}));

vi.mock("@/lib/identity/auth.ts", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

export const defaultSession = {
  session: {
    id: "test-session-id",
    userId: "test-user-id",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    token: "test-token",
  },
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
};

export function mockSession(session = defaultSession) {
  vi.mocked(auth.api.getSession).mockResolvedValue(session);
}

export { auth };

/**
 * Returns a type-safe oRPC client for testing.
 * Automatically routes requests through the local Next.js API handler.
 */
export function getRpcClient(workspaceId?: string): RouterClient<RPCRouter> {
  return createClient("http://localhost/api/rpc", async (url, init) => {
    const mod = await import("@/app/api/rpc/[[...route]]/route.ts");
    const req = new NextRequest(url, init as never);
    const method = req.method as keyof typeof mod;

    if (workspaceId) req.headers.set(WORKSPACE_ID_HEADER, workspaceId);

    return mod[method](req);
  });
}
