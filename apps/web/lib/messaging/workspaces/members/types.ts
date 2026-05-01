import * as schema from "@mini-slack/db/index.ts";
import { z } from "zod";

export type WorkspaceMember = typeof schema.workspaceMembers.$inferSelect;

export const WorkspaceMemberRole = z.enum(
  schema.workspaceMemberRoleEnum.enumValues,
);
export type WorkspaceMemberRole = z.infer<typeof WorkspaceMemberRole>;

export const ListWorkspaceMembersInput = z.object();
export type ListWorkspaceMembersInput = z.infer<
  typeof ListWorkspaceMembersInput
>;
export type ListWorkspaceMembersOutput = WorkspaceMember[];

export const GetWorkspaceMemberInput = z.object({
  userId: z.string(),
});
export type GetWorkspaceMemberInput = z.infer<typeof GetWorkspaceMemberInput>;
export type GetWorkspaceMemberOutput = WorkspaceMember | undefined;

export const UpdateWorkspaceMemberRoleInput = z.object({
  userId: z.string(),
  role: WorkspaceMemberRole,
});
export type UpdateWorkspaceMemberRoleInput = z.infer<
  typeof UpdateWorkspaceMemberRoleInput
>;
export type UpdateWorkspaceMemberRoleOutput = WorkspaceMember;

export const UpdateWorkspaceMemberProfileInput = z
  .object({
    userId: z.string(),
    name: z.string().min(1).max(255).optional(),
    avatarUrl: z.url().max(512).optional(),
  })
  .refine((data) => data.name !== undefined || data.avatarUrl !== undefined, {
    error: "At least one of name or avatarUrl must be provided",
  });

export type UpdateWorkspaceMemberProfileInput = z.infer<
  typeof UpdateWorkspaceMemberProfileInput
>;
export type UpdateWorkspaceMemberProfileOutput = WorkspaceMember;

export const RemoveWorkspaceMemberInput = z.object({
  userId: z.string(),
});
export type RemoveWorkspaceMemberInput = z.infer<
  typeof RemoveWorkspaceMemberInput
>;
export type RemoveWorkspaceMemberOutput = { id: string };
