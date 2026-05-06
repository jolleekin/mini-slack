/**
 * Integration tests for the Better Auth new-user detection hook.
 *
 * The hook lives in `auth.ts` as an `after` hook on `createAuthMiddleware`.
 * It fires after `/magic-link/verify` and `/callback` paths, queries
 * `workspace_members` for the authenticated user, and throws a redirect to
 * `/welcome` when the user has zero memberships.
 *
 * Strategy: mock `@/lib/db.ts` so no real DB connection is needed, then
 * invoke the hook callback directly with a minimal crafted context object
 * that mirrors what Better Auth / better-call passes at runtime.
 */

import * as schema from "@mini-slack/db/index.ts";
import { APIError } from "better-call";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/identity/auth.ts";

// ---------------------------------------------------------------------------
// vi.hoisted() ensures mockDb is available when vi.mock() factory runs
// (vi.mock calls are hoisted to the top of the file by Vitest).
// ---------------------------------------------------------------------------
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/db.ts", () => ({
  db: mockDb,
}));

// Also mock mail so the magicLink plugin doesn't complain during init.
vi.mock("@/lib/mail.ts", () => ({
  sendMail: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal better-call context object that satisfies the hook.
 * Only the fields actually read by the hook are required.
 */
function buildCtx(
  path: string,
  userId: string | null,
  members: unknown[],
): {
  path: string;
  context: { session: { user: { id: string } } | null };
  redirect: (url: string) => APIError;
} {
  // Simulate the db.select().from().where() chain returning `members`.
  const whereMock = vi.fn().mockResolvedValue(members);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  mockDb.select.mockReturnValue({ from: fromMock });

  return {
    path,
    context: {
      session: userId ? { user: { id: userId } } : null,
    },
    // Mirrors better-call's ctx.redirect: returns an APIError("FOUND") with
    // a `location` header set to the redirect URL.
    redirect: (url: string) => {
      const headers = new Headers({ location: url });
      return new APIError("FOUND", undefined, headers);
    },
  };
}

/**
 * Extracts the raw hook callback from the Better Auth instance.
 * Better Auth stores hooks on `auth.options.hooks`.
 */
function getAfterHook(): (ctx: ReturnType<typeof buildCtx>) => Promise<void> {
  // `auth.options` is typed as the options passed to betterAuth().
  // The `after` hook is a middleware created with createAuthMiddleware.
  // We reach into the internals to get the handler function.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = (auth as any).options as {
    hooks?: { after?: { handler?: (ctx: unknown) => Promise<void> } };
  };
  const afterHook = options?.hooks?.after;
  if (!afterHook) throw new Error("after hook not found on auth.options");
  // createAuthMiddleware wraps the callback; the raw handler is on `.handler`
  // (better-call middleware shape).
  const handler =
    (afterHook as { handler?: (ctx: unknown) => Promise<void> }).handler ??
    (afterHook as unknown as (ctx: unknown) => Promise<void>);
  if (typeof handler !== "function") {
    throw new Error("after hook handler is not a function");
  }
  return handler as (ctx: ReturnType<typeof buildCtx>) => Promise<void>;
}

/**
 * Asserts that calling the hook with `ctx` throws an APIError redirect to
 * the given URL (checked via `error.headers.get('location')`).
 */
async function assertRedirectsTo(
  hook: (ctx: ReturnType<typeof buildCtx>) => Promise<void>,
  ctx: ReturnType<typeof buildCtx>,
  expectedUrl: string,
): Promise<void> {
  let thrown: unknown;
  try {
    await hook(ctx);
  } catch (err) {
    thrown = err;
  }
  expect(thrown).toBeInstanceOf(APIError);
  const locationHeader = ((thrown as APIError).headers as Headers).get("location");
  expect(locationHeader).toBe(expectedUrl);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Better Auth after hook — new-user detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Magic Link verify path
  // -------------------------------------------------------------------------

  describe("/magic-link/verify", () => {
    it("redirects to /welcome when user has zero workspace memberships", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/magic-link/verify", "user-123", []);

      await assertRedirectsTo(hook, ctx, "/welcome");
    });

    it("does NOT redirect when user has at least one workspace membership", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/magic-link/verify", "user-456", [
        { workspaceId: "ws-1", userId: "user-456" },
      ]);

      // Should resolve without throwing.
      await expect(hook(ctx)).resolves.toBeUndefined();
    });

    it("does NOT redirect when there is no session", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/magic-link/verify", null, []);

      // No session → hook skips the DB query and returns without throwing.
      await expect(hook(ctx)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // OAuth callback path
  // -------------------------------------------------------------------------

  describe("/callback (GitHub OAuth)", () => {
    it("redirects to /welcome when user has zero workspace memberships", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/callback/github", "user-789", []);

      await assertRedirectsTo(hook, ctx, "/welcome");
    });

    it("does NOT redirect when user has at least one workspace membership", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/callback/github", "user-789", [
        { workspaceId: "ws-2", userId: "user-789" },
      ]);

      await expect(hook(ctx)).resolves.toBeUndefined();
    });

    it("covers any /callback/* sub-path (e.g. /callback/google)", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/callback/google", "user-999", []);

      await assertRedirectsTo(hook, ctx, "/welcome");
    });
  });

  // -------------------------------------------------------------------------
  // Paths that should NOT trigger the hook
  // -------------------------------------------------------------------------

  describe("unrelated paths", () => {
    it("does NOT redirect on /sign-in/email", async () => {
      const hook = getAfterHook();
      // Even with zero memberships, unrelated paths must not redirect.
      const ctx = buildCtx("/sign-in/email", "user-123", []);

      await expect(hook(ctx)).resolves.toBeUndefined();
    });

    it("does NOT redirect on /sign-out", async () => {
      const hook = getAfterHook();
      const ctx = buildCtx("/sign-out", "user-123", []);

      await expect(hook(ctx)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // DB query correctness
  // -------------------------------------------------------------------------

  describe("DB query", () => {
    it("queries workspace_members filtered by the authenticated user ID", async () => {
      const hook = getAfterHook();
      const userId = "user-query-check";

      // Set up the mock chain BEFORE building ctx so buildCtx doesn't
      // overwrite mockDb.select with its own fresh mock.
      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const ctx = {
        path: "/magic-link/verify",
        context: { session: { user: { id: userId } } },
        redirect: (url: string) => {
          const headers = new Headers({ location: url });
          return new APIError("FOUND", undefined, headers);
        },
      };

      await assertRedirectsTo(hook, ctx, "/welcome");

      // Verify the query targeted the workspaceMembers table.
      expect(fromMock).toHaveBeenCalledWith(schema.workspaceMembers);

      // Verify a where clause was applied (filtering by userId).
      expect(whereMock).toHaveBeenCalledWith(
        eq(schema.workspaceMembers.userId, userId),
      );
    });
  });
});
