import { UnauthenticatedError } from "@mini-slack/errors/index.ts";
import { TranslationKey } from "@mini-slack/i18n/index.ts";
import { Id } from "@mini-slack/id-gen/index.ts";

import { Db } from "@/lib/db.ts";
import en from "@/lib/errors/locales/en.json";

/**
 * The currently authenticated user.
 *
 * This is a generic interface to ensure the Messaging service remains decoupled
 * from the Identity database schema.
 */
export interface UserActor {
  type: "user";
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface SystemActor {
  type: "system";
  id: string;
  name: string;
}

export type Actor = UserActor | SystemActor;

/**
 * CONTEXT TYPE HIERARCHY & MIGRATION GUIDE
 * =========================================
 *
 * Three context types represent different guarantees:
 *
 * 1. ServiceContext (base, optional workspace)
 *    - Use when: service can run in multiple contexts (background jobs, tests, generic utilities)
 *    - Call requireWorkspaceId() if workspace is needed
 *    - Example: utility services that work inside or outside a workspace
 *
 * 2. WorkspaceServiceContext (required workspace)
 *    - Use when: RPC handlers in workspaceProcedure routers (workspace membership validated by middleware)
 *    - Gateway/middleware guarantees: user is authenticated, user is workspace member, workspaceId is present
 *    - No need to call requireWorkspaceId() - directly access ctx.workspaceId!
 *    - Still need to call requireUser() if actor could be SystemActor
 *    - Example: channel.list(), message.create(), workspace.update()
 *    - NOTE: Currently implemented as runtime guarantee, not TypeScript narrowing
 *
 * 3. UserWorkspaceServiceContext (required workspace + guaranteed user actor)
 *    - Use when: operations that definitely need both authenticated user AND workspace
 *    - Gateway/middleware guarantees: user is authenticated, user is workspace member, workspaceId is present
 *    - No need to call requireUser() or requireWorkspaceId()
 *    - Directly access ctx.actor and ctx.workspaceId as non-optional
 *    - Example: message.create() where actor identity is always required
 *
 * MIGRATION FLOW
 * ==============
 *
 * For RPC handlers using workspaceProcedure:
 *
 *   OLD (ServiceContext with defensive checks):
 *   export async function listChannels(ctx: ServiceContext, input) {
 *     const user = requireUser(ctx);
 *     const workspaceId = requireWorkspaceId(ctx);
 *     // ...
 *   }
 *
 *   NEW (WorkspaceServiceContext, checks eliminated at middleware):
 *   export async function listChannels(ctx: WorkspaceServiceContext, input) {
 *     const user = requireUser(ctx); // actor might still be SystemActor
 *     const workspaceId = ctx.workspaceId; // guaranteed present
 *     // ...
 *   }
 */

/**
 * Global application context passed to service functions.
 * Encapsulates the current user's identity and the database connection/transaction.
 * `workspaceId` is optional - use WorkspaceServiceContext if workspace access is required.
 */
export interface ServiceContext<DbType = Db> {
  actor: Actor;
  db: DbType;
  workspaceId?: Id | null;
  locale?: string | null;
  /** Translates error messages */
  t: (
    key: TranslationKey<typeof en>,
    params?: Record<string, unknown>,
  ) => string;
}

/**
 * Service context with guaranteed workspace context.
 * Used for operations that require a specific workspace.
 * Middleware/gateway validates membership before this context is created.
 */
export interface WorkspaceServiceContext<
  DbType = Db,
> extends ServiceContext<DbType> {
  workspaceId: Id;
}

export function requireUser(ctx: ServiceContext): UserActor {
  if (ctx.actor.type !== "user") {
    throw new UnauthenticatedError();
  }

  return ctx.actor;
}

export function requireWorkspaceId(ctx: ServiceContext): Id {
  if (!ctx.workspaceId) {
    throw new UnauthenticatedError({ i18nKey: "workspace_context_required" });
  }

  return ctx.workspaceId;
}
