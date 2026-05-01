import * as schema from "@mini-slack/db/index.ts";
import { ConflictError, ForbiddenError } from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceMemberRemovedEvent,
} from "@mini-slack/events/index.ts";
import { Id } from "@mini-slack/id-gen/index.ts";
import { and, eq, sql } from "drizzle-orm";

import {
  ServiceContext,
  WorkspaceServiceContext,
  requireUser,
} from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import {
  GetWorkspaceMemberInput,
  GetWorkspaceMemberOutput,
  ListWorkspaceMembersInput,
  ListWorkspaceMembersOutput,
  RemoveWorkspaceMemberInput,
  RemoveWorkspaceMemberOutput,
  UpdateWorkspaceMemberProfileInput,
  UpdateWorkspaceMemberProfileOutput,
  UpdateWorkspaceMemberRoleInput,
  UpdateWorkspaceMemberRoleOutput,
  WorkspaceMemberRole,
} from "./types.ts";

/**
 * Retrieves the role of a user in a specific workspace.
 */
export async function getWorkspaceMemberRole(
  ctx: WorkspaceServiceContext,
  input: { userId?: Id },
): Promise<WorkspaceMemberRole | undefined> {
  const userId = input.userId ?? requireUser(ctx).id;

  const [member] = await ctx.db
    .select({ role: schema.workspaceMembers.role })
    .from(schema.workspaceMembers)
    .where(
      and(
        eq(schema.workspaceMembers.workspaceId, ctx.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    )
    .limit(1);

  return member?.role;
}

/**
 * Checks if a user has admin permissions in a specific workspace.
 * Returns true if the user is a workspace owner or admin.
 */
export async function canManageWorkspace(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: object,
): Promise<boolean> {
  const role = await getWorkspaceMemberRole(ctx, {});
  return role === "owner" || role === "admin";
}

/**
 * Checks if a user can view a workspace's information.
 * Returns true if the user is a workspace member.
 */
export async function canViewWorkspace(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: object,
): Promise<boolean> {
  const role = await getWorkspaceMemberRole(ctx, {});
  return role !== undefined;
}

/**
 * Gets a specific workspace member's details.
 */
export async function getWorkspaceMember(
  ctx: WorkspaceServiceContext,
  input: GetWorkspaceMemberInput,
): Promise<GetWorkspaceMemberOutput> {
  const workspaceId = ctx.workspaceId;

  if (!(await canViewWorkspace(ctx, {}))) {
    throw new ForbiddenError({ i18nKey: "workspaces.members.cant_view" });
  }

  const [member] = await ctx.db
    .select()
    .from(schema.workspaceMembers)
    .where(
      and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, input.userId),
      ),
    )
    .limit(1);

  return member;
}

/**
 * Lists all members of a workspace with their basic user information.
 */
export async function listWorkspaceMembers(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: ListWorkspaceMembersInput,
): Promise<ListWorkspaceMembersOutput> {
  const workspaceId = ctx.workspaceId;

  if (!(await canViewWorkspace(ctx, {}))) {
    throw new ForbiddenError({ i18nKey: "workspaces.members.cant_view" });
  }

  const members = await ctx.db
    .select()
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

  return members;
}

/**
 * Updates a workspace member's role.
 *
 * Permission: Only workspace owners and admins can update roles.
 */
export async function updateWorkspaceMemberRole(
  ctx: WorkspaceServiceContext,
  input: UpdateWorkspaceMemberRoleInput,
): Promise<UpdateWorkspaceMemberRoleOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { userId, role } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageWorkspace(txCtx, {}))) {
      throw new ForbiddenError({
        i18nKey: "workspaces.members.cant_update_role",
      });
    }

    // Prevent owner downgrade if they are the last owner.
    if (userId === user.id && role !== "owner") {
      const owners = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, workspaceId),
            eq(schema.workspaceMembers.role, "owner"),
          ),
        );

      if (Number(owners[0].count) <= 1) {
        throw new ConflictError({
          i18nKey: "workspaces.members.cant_downgrade_last_owner",
        });
      }
    }

    const [updatedMember] = await tx
      .update(schema.workspaceMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      )
      .returning();

    return updatedMember;
  });
}

/**
 * Updates a workspace member's profile (name, avatar).
 *
 * Permission: Only the user themselves can update their profile.
 */
export async function updateWorkspaceMemberProfile(
  ctx: WorkspaceServiceContext,
  input: UpdateWorkspaceMemberProfileInput,
): Promise<UpdateWorkspaceMemberProfileOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { userId, ...profile } = input;

  if (user.id !== userId) {
    throw new ForbiddenError({
      i18nKey: "workspaces.members.cant_update_profile",
    });
  }

  const [updatedMember] = await ctx.db
    .update(schema.workspaceMembers)
    .set({
      ...profile,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    )
    .returning();

  return updatedMember;
}

/**
 * Removes a member from a workspace.
 */
export async function removeWorkspaceMember(
  ctx: WorkspaceServiceContext,
  input: RemoveWorkspaceMemberInput,
): Promise<RemoveWorkspaceMemberOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { userId } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (user.id !== userId && !(await canManageWorkspace(txCtx, {}))) {
      throw new ForbiddenError({
        i18nKey: "workspaces.members.cant_remove",
      });
    }

    // Check if target is the last owner.
    const targetRole = await getWorkspaceMemberRole(txCtx, { userId });
    if (targetRole === "owner") {
      const owners = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, workspaceId),
            eq(schema.workspaceMembers.role, "owner"),
          ),
        );

      if (Number(owners[0].count) <= 1) {
        throw new ConflictError({
          i18nKey: "workspaces.members.cant_remove_last_owner",
        });
      }
    }

    await tx
      .delete(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      );

    await publishEvent<WorkspaceMemberRemovedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: workspaceId,
      aggregateType: AggregateType.WORKSPACE,
      eventType: EventType.WORKSPACE_MEMBER_REMOVED,
      payload: {
        workspaceId,
        userId,
      },
    });

    return { id: userId };
  });
}

/**
 * Synchronizes a user's email across all their workspace memberships.
 * This is typically called by an event consumer handling USER_UPDATED events.
 */
export async function syncWorkspaceMemberEmail(
  ctx: ServiceContext,
  input: {
    userId: Id;
    email: string;
    emailVerified: boolean;
  },
): Promise<void> {
  const { userId, email, emailVerified } = input;

  await ctx.db
    .update(schema.workspaceMembers)
    .set({
      email,
      emailVerified,
      updatedAt: new Date(),
    })
    .where(eq(schema.workspaceMembers.userId, userId));
}
