import * as schema from "@mini-slack/db/index.ts";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@mini-slack/errors/index.ts";
import {
  AggregateType,
  EventType,
  WorkspaceMemberAddedEvent,
} from "@mini-slack/events/index.ts";
import { generateRandomId } from "@mini-slack/id-gen/index.ts";
import { and, eq } from "drizzle-orm";

import { WorkspaceServiceContext, requireUser } from "@/lib/context.ts";
import "@/lib/errors/i18n.ts";
import { publishEvent } from "@/lib/server-utils.ts";

import { canManageWorkspace } from "../members/service.ts";

import { INVITATION_TTL_DAYS } from "./constants.ts";
import {
  AcceptWorkspaceInvitationInput,
  AcceptWorkspaceInvitationOutput,
  CreateWorkspaceInvitationInput,
  CreateWorkspaceInvitationOutput,
  ListWorkspaceInvitationsInput,
  ListWorkspaceInvitationsOutput,
  RevokeWorkspaceInvitationInput,
  RevokeWorkspaceInvitationOutput,
} from "./types.ts";

/**
 * Invites a user to a workspace.
 */
export async function createWorkspaceInvitation(
  ctx: WorkspaceServiceContext,
  input: CreateWorkspaceInvitationInput,
): Promise<CreateWorkspaceInvitationOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageWorkspace(txCtx, {}))) {
      throw new ForbiddenError({
        i18nKey: "workspaces.invitations.cant_create",
      });
    }

    // Check if a pending invitation already exists for this email.
    const [existingInvitation] = await tx
      .select()
      .from(schema.workspaceInvitations)
      .where(
        and(
          eq(schema.workspaceInvitations.workspaceId, workspaceId),
          eq(schema.workspaceInvitations.email, input.email),
          eq(schema.workspaceInvitations.status, "pending"),
        ),
      )
      .limit(1);

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new ConflictError({
        i18nKey: "workspaces.invitations.already_exists",
        metadata: { email: input.email },
      });
    }

    const invitationId = generateRandomId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

    const [invitation] = await tx
      .insert(schema.workspaceInvitations)
      .values({
        id: invitationId,
        workspaceId,
        email: input.email,
        role: input.role,
        inviterId: user.id,
        expiresAt,
      })
      .returning();

    return invitation;
  });
}

/**
 * Lists all pending invitations for a workspace.
 *
 * Permission: Only workspace owners and admins can view invitations.
 */
export async function listWorkspaceInvitations(
  ctx: WorkspaceServiceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: ListWorkspaceInvitationsInput,
): Promise<ListWorkspaceInvitationsOutput> {
  if (!(await canManageWorkspace(ctx, {}))) {
    throw new ForbiddenError({
      i18nKey: "workspaces.invitations.cant_view",
    });
  }

  return await ctx.db
    .select()
    .from(schema.workspaceInvitations)
    .where(
      and(
        eq(schema.workspaceInvitations.workspaceId, ctx.workspaceId),
        eq(schema.workspaceInvitations.status, "pending"),
      ),
    );
}

/**
 * Accepts a workspace invitation.
 */
export async function acceptWorkspaceInvitation(
  ctx: WorkspaceServiceContext,
  input: AcceptWorkspaceInvitationInput,
): Promise<AcceptWorkspaceInvitationOutput> {
  const user = requireUser(ctx);
  const workspaceId = ctx.workspaceId;
  const { invitationId } = input;

  return await ctx.db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(schema.workspaceInvitations)
      .where(
        and(
          eq(schema.workspaceInvitations.workspaceId, workspaceId),
          eq(schema.workspaceInvitations.id, invitationId),
        ),
      )
      .limit(1);

    if (!invitation) {
      throw new NotFoundError({ i18nKey: "workspaces.invitations.not_found" });
    }

    if (invitation.status !== "pending") {
      throw new ConflictError({
        i18nKey: "workspaces.invitations.not_pending",
        metadata: { status: invitation.status },
      });
    }

    if (invitation.expiresAt < new Date()) {
      await tx
        .update(schema.workspaceInvitations)
        .set({ status: "expired" })
        .where(eq(schema.workspaceInvitations.id, invitationId));

      throw new ConflictError({ i18nKey: "workspaces.invitations.expired" });
    }

    const [member] = await tx
      .insert(schema.workspaceMembers)
      .values({
        workspaceId,
        userId: user.id,
        name: user.name,
        email: invitation.email,
        emailVerified: true,
        avatarUrl: user.image,
        role: invitation.role,
      })
      .returning();

    await tx
      .update(schema.workspaceInvitations)
      .set({ status: "accepted" })
      .where(eq(schema.workspaceInvitations.id, invitationId));

    const txCtx = { ...ctx, db: tx };

    await publishEvent<WorkspaceMemberAddedEvent>(txCtx, {
      partitionKey: workspaceId,
      aggregateId: workspaceId,
      aggregateType: AggregateType.WORKSPACE,
      eventType: EventType.WORKSPACE_MEMBER_ADDED,
      payload: { member },
    });

    return member;
  });
}

/**
 * Revokes advocacy invitation.
 */
export async function revokeWorkspaceInvitation(
  ctx: WorkspaceServiceContext,
  input: RevokeWorkspaceInvitationInput,
): Promise<RevokeWorkspaceInvitationOutput> {
  const workspaceId = ctx.workspaceId;
  const { invitationId } = input;

  return await ctx.db.transaction(async (tx) => {
    const txCtx = { ...ctx, db: tx };

    if (!(await canManageWorkspace(txCtx, {}))) {
      throw new ForbiddenError({
        i18nKey: "workspaces.invitations.cant_revoke",
      });
    }

    const [invitation] = await tx
      .update(schema.workspaceInvitations)
      .set({ status: "rejected" })
      .where(
        and(
          eq(schema.workspaceInvitations.workspaceId, workspaceId),
          eq(schema.workspaceInvitations.id, invitationId),
        ),
      )
      .returning();

    return invitation;
  });
}
