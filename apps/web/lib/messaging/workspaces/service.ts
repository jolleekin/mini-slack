import * as schema from "@mini-slack/db/index.ts";
import { ForbiddenError, NotFoundError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceCreatedEvent,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
} from "@mini-slack/events/index.ts";
import { generateRandomId } from "@mini-slack/id-gen/index.ts";
import { eq } from "drizzle-orm";

import {
  ServiceContext,
  WorkspaceServiceContext,
  requireUser,
} from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";
import {
  mapUniqueViolationToConflict,
  publishEvent,
} from "@/lib/server-utils.ts";

import { createChannel_internal } from "../channels/service.ts";

import { getWorkspaceMemberRole } from "./members/service.ts";
import {
  CreateWorkspaceInput,
  CreateWorkspaceOutput,
  DeleteWorkspaceInput,
  DeleteWorkspaceOutput,
  GetWorkspaceInput,
  GetWorkspaceOutput,
  ListWorkspacesInput,
  ListWorkspacesOutput,
  UpdateWorkspaceInput,
  UpdateWorkspaceOutput,
} from "./types.ts";

/**
 * Creates a new workspace and adds the creator as a member with the 'owner' role.
 * Also creates a default channel.
 */
export async function createWorkspace(
  ctx: ServiceContext,
  input: CreateWorkspaceInput,
): Promise<CreateWorkspaceOutput> {
  const user = requireUser(ctx);

  return await ctx.db.transaction(async (tx) => {
    const workspaceId = generateRandomId();
    const txCtx = { ...ctx, db: tx, workspaceId };

    try {
      const [workspace] = await tx
        .insert(schema.workspaces)
        .values({
          id: workspaceId,
          name: input.name,
          slug: input.slug,
        })
        .returning();

      const p1 = createChannel_internal(txCtx, {
        name: input.defaultChannelName,
        type: "public",
      });

      const p2 = tx.insert(schema.workspaceMembers).values({
        workspaceId,
        userId: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: "owner",
      });

      const p3 = publishEvent<WorkspaceCreatedEvent>(txCtx, {
        partitionKey: workspaceId,
        aggregateId: workspaceId,
        aggregateType: AggregateType.WORKSPACE,
        eventType: EventType.WORKSPACE_CREATED,
        payload: {
          workspace,
          ownerId: user.id,
        },
      });

      const [defaultChannel] = await Promise.all([p1, p2, p3]);

      return { workspace, defaultChannel };
    } catch (error) {
      // If the error is due to a unique constraint violation,
      // it must be because the workspace URL is already taken.
      mapUniqueViolationToConflict(error, {
        i18nKey: "workspaces.slug_taken",
        metadata: { slug: input.slug },
      });
    }
  });
}

/**
 * Retrieves a specific workspace for a user, including their role.
 */
export async function getWorkspace(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: GetWorkspaceInput,
): Promise<GetWorkspaceOutput> {
  const workspaceId = ctx.workspaceId;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx } as WorkspaceServiceContext<typeof tx>;

    const role = await getWorkspaceMemberRole(txCtx, {});

    if (role === undefined) {
      throw new NotFoundError({
        i18nKey: "workspaces.not_found",
        metadata: { workspaceId },
      });
    }

    const [workspace] = await tx
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError({
        i18nKey: "workspaces.not_found",
        metadata: { workspaceId },
      });
    }

    return { ...workspace, role };
  });
}

/**
 * Lists all workspaces that a specific user belongs to.
 */
export function listWorkspaces(
  ctx: ServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: ListWorkspacesInput,
): Promise<ListWorkspacesOutput> {
  const user = requireUser(ctx);

  return ctx.db
    .select({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      createdAt: schema.workspaces.createdAt,
      updatedAt: schema.workspaces.updatedAt,
      slug: schema.workspaces.slug,
      logoUrl: schema.workspaces.logoUrl,
      role: schema.workspaceMembers.role,
    })
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.userId, user.id))
    .innerJoin(
      schema.workspaces,
      eq(schema.workspaceMembers.workspaceId, schema.workspaces.id),
    );
}

export async function updateWorkspace(
  ctx: WorkspaceServiceContext,
  input: UpdateWorkspaceInput,
): Promise<UpdateWorkspaceOutput> {
  const workspaceId = ctx.workspaceId;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx } as WorkspaceServiceContext<typeof tx>;
    if ((await getWorkspaceMemberRole(txCtx, {})) !== "owner") {
      throw new ForbiddenError({
        i18nKey: "workspaces.cant_update",
      });
    }

    try {
      const [updatedWorkspace] = await tx
        .update(schema.workspaces)
        .set(input)
        .where(eq(schema.workspaces.id, workspaceId))
        .returning();

      await publishEvent<WorkspaceUpdatedEvent>(txCtx, {
        partitionKey: workspaceId,
        aggregateId: workspaceId,
        aggregateType: AggregateType.WORKSPACE,
        eventType: EventType.WORKSPACE_UPDATED,
        payload: {
          workspace: updatedWorkspace,
        },
      });

      return updatedWorkspace;
    } catch (error) {
      mapUniqueViolationToConflict(error, {
        i18nKey: "workspaces.slug_taken",
        metadata: { slug: input.slug! },
      });
    }
  });
}

/**
 * Deletes a workspace if the given user has the owner role.
 */
export async function deleteWorkspace(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: DeleteWorkspaceInput,
): Promise<DeleteWorkspaceOutput> {
  const workspaceId = ctx.workspaceId;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx } as WorkspaceServiceContext<typeof tx>;

    if ((await getWorkspaceMemberRole(txCtx, {})) !== "owner") {
      throw new ForbiddenError({
        i18nKey: "workspaces.cant_delete",
      });
    }

    const p1 = tx
      .delete(schema.workspaces)
      .where(eq(schema.workspaces.id, workspaceId));

    const p2 = publishEvent<WorkspaceDeletedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: workspaceId,
      aggregateType: AggregateType.WORKSPACE,
      eventType: EventType.WORKSPACE_DELETED,
      payload: {
        workspaceId,
      },
    });

    await Promise.all([p1, p2]);

    return { id: workspaceId };
  });
}
