import {
  AppError,
  AppErrorCode,
  AppErrorTranslationKeyMap,
  ForbiddenError,
} from "@mini-slack/errors/index.ts";
import { logger } from "@mini-slack/logger/index.ts";
import { ORPCError, os } from "@orpc/server";

import { ServiceContext, WorkspaceServiceContext } from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";

import { getWorkspaceMemberRole } from "../get-workspace-member-role.ts";

function toHttpStatus(code: AppErrorCode): number {
  switch (code) {
    case "VALIDATION":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "INTERNAL":
    default:
      return 500;
  }
}

/**
 * Base procedure that maps application errors to oRPC errors.
 */
export const procedure = os
  .$context<ServiceContext>()
  .use(async ({ next, context }) => {
    try {
      return await next();
    } catch (err) {
      logger.error(err);

      if (err instanceof AppError) {
        const i18nKey =
          (err.i18nKey as keyof AppErrorTranslationKeyMap | undefined) ??
          (err.code.toLowerCase() as Lowercase<AppErrorCode>);

        const message = context.t(i18nKey, err.data);

        throw new ORPCError(err.code, {
          status: toHttpStatus(err.code),
          message,
          data: err.data,
        });
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        status: 500,
        message: context.t("internal"),
      });
    }
  });

/**
 * Procedure that validates the workspace membership of the authenticated user.
 * Narrows context type to {@linkcode WorkspaceServiceContext} for downstream
 * handlers.
 */
export const workspaceProcedure = procedure.use(async ({ next, context }) => {
  if (!context.workspaceId) {
    throw new ForbiddenError({
      i18nKey: "workspace_context_required",
    });
  }

  const role = await getWorkspaceMemberRole(
    context as WorkspaceServiceContext,
    {},
  );

  if (role === undefined) {
    throw new ForbiddenError({
      i18nKey: "workspace_access_denied",
    });
  }

  // Context is now guaranteed to have workspaceId and user is workspace member.
  return next({ context: context as WorkspaceServiceContext });
});
