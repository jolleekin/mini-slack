import * as schema from "@mini-slack/db";
import { z } from "zod";

import {
  MAX_CHANNEL_NAME_LENGTH,
  MAX_WORKSPACE_SLUG_LENGTH,
  SLUG_REGEX,
} from "@/lib/messaging/constants.ts";

import { Channel } from "../channels/types";

export type Workspace = typeof schema.workspaces.$inferSelect;

export type WorkspaceRole = typeof schema.workspaceMembers.$inferSelect.role;

/**
 * A workspace with the requesting user's role.
 */
export type WorkspaceWithRole = Workspace & { role: WorkspaceRole };

// TODO: move to the Identity module since the operation is user-centric.
export const ListWorkspacesInput = z.object();
export type ListWorkspacesInput = z.infer<typeof ListWorkspacesInput>;
export type ListWorkspacesOutput = WorkspaceWithRole[];

export const GetWorkspaceInput = z.object();
export type GetWorkspaceInput = z.infer<typeof GetWorkspaceInput>;
export type GetWorkspaceOutput = WorkspaceWithRole;

export const CreateWorkspaceInput = z.object({
  name: z.string().min(1, "Workspace name is required"),
  slug: z
    .string()
    .min(1, "Workspace URL is required")
    .max(
      MAX_WORKSPACE_SLUG_LENGTH,
      `Workspace URL cannot be longer than ${MAX_WORKSPACE_SLUG_LENGTH} characters`,
    )
    .regex(
      SLUG_REGEX,
      "Workspace URL can only contain lowercase letters, numbers, and hyphens",
    ),
  defaultChannelName: z
    .string()
    .min(1, "Default channel name is required")
    .max(
      MAX_CHANNEL_NAME_LENGTH,
      `Channel name cannot be longer than ${MAX_CHANNEL_NAME_LENGTH} characters`,
    )
    .regex(
      SLUG_REGEX,
      "Channel name can only contain lowercase letters, numbers, and hyphens",
    ),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;
export type CreateWorkspaceOutput = {
  workspace: Workspace;
  defaultChannel: Channel;
};

export const UpdateWorkspaceInput = z.object({
  name: z.string().min(1, "Workspace name cannot be empty").optional(),
  slug: z
    .string()
    .min(1, "Workspace URL cannot be empty")
    .max(
      MAX_WORKSPACE_SLUG_LENGTH,
      `Workspace URL cannot be longer than ${MAX_WORKSPACE_SLUG_LENGTH} characters`,
    )
    .regex(
      SLUG_REGEX,
      "Workspace URL can only contain lowercase letters, numbers, and hyphens",
    )
    .optional(),
  logoUrl: z.url("Must be a valid URL").optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInput>;
export type UpdateWorkspaceOutput = Workspace;

export const DeleteWorkspaceInput = z.object();
export type DeleteWorkspaceInput = z.infer<typeof DeleteWorkspaceInput>;
export type DeleteWorkspaceOutput = { id: string };
