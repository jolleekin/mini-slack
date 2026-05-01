import {
  getWorkspaceMember,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberProfile,
  updateWorkspaceMemberRole,
} from "@/lib/messaging/workspaces/members/service.ts";
import {
  GetWorkspaceMemberInput,
  ListWorkspaceMembersInput,
  RemoveWorkspaceMemberInput,
  UpdateWorkspaceMemberProfileInput,
  UpdateWorkspaceMemberRoleInput,
} from "@/lib/messaging/workspaces/members/types.ts";

import { workspaceProcedure } from "./orpc.ts";

export const workspaceMembersRouter = {
  list: workspaceProcedure
    .input(ListWorkspaceMembersInput)
    .handler((o) => listWorkspaceMembers(o.context, o.input)),

  get: workspaceProcedure
    .input(GetWorkspaceMemberInput)
    .handler((o) => getWorkspaceMember(o.context, o.input)),

  updateRole: workspaceProcedure
    .input(UpdateWorkspaceMemberRoleInput)
    .handler((o) => updateWorkspaceMemberRole(o.context, o.input)),

  updateProfile: workspaceProcedure
    .input(UpdateWorkspaceMemberProfileInput)
    .handler((o) => updateWorkspaceMemberProfile(o.context, o.input)),

  remove: workspaceProcedure
    .input(RemoveWorkspaceMemberInput)
    .handler((o) => removeWorkspaceMember(o.context, o.input)),
};
