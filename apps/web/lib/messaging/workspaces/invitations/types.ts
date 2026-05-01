import * as schema from "@mini-slack/db/index.ts";
import { z } from "zod";

import { WorkspaceMemberRole } from "../members/types.ts";

export type WorkspaceInvitation =
  typeof schema.workspaceInvitations.$inferSelect;

export const CreateWorkspaceInvitationInput = z.object({
  email: z.email(),
  role: WorkspaceMemberRole.default("member"),
});
export type CreateWorkspaceInvitationInput = z.infer<
  typeof CreateWorkspaceInvitationInput
>;
export type CreateWorkspaceInvitationOutput = WorkspaceInvitation;

export const ListWorkspaceInvitationsInput = z.object();
export type ListWorkspaceInvitationsInput = z.infer<
  typeof ListWorkspaceInvitationsInput
>;
export type ListWorkspaceInvitationsOutput = WorkspaceInvitation[];

export const AcceptWorkspaceInvitationInput = z.object({
  invitationId: z.string(),
});
export type AcceptWorkspaceInvitationInput = z.infer<
  typeof AcceptWorkspaceInvitationInput
>;
export type AcceptWorkspaceInvitationOutput =
  typeof schema.workspaceMembers.$inferSelect;

export const RevokeWorkspaceInvitationInput = z.object({
  invitationId: z.string(),
});
export type RevokeWorkspaceInvitationInput = z.infer<
  typeof RevokeWorkspaceInvitationInput
>;
export type RevokeWorkspaceInvitationOutput = WorkspaceInvitation;
