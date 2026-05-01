import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  revokeWorkspaceInvitation,
} from "@/lib/messaging/workspaces/invitations/service.ts";
import {
  AcceptWorkspaceInvitationInput,
  CreateWorkspaceInvitationInput,
  ListWorkspaceInvitationsInput,
  RevokeWorkspaceInvitationInput,
} from "@/lib/messaging/workspaces/invitations/types.ts";

import { workspaceProcedure } from "./orpc.ts";

export const invitationsRouter = {
  list: workspaceProcedure
    .input(ListWorkspaceInvitationsInput)
    .handler((o) => listWorkspaceInvitations(o.context, o.input)),

  create: workspaceProcedure
    .input(CreateWorkspaceInvitationInput)
    .handler((o) => createWorkspaceInvitation(o.context, o.input)),

  accept: workspaceProcedure
    .input(AcceptWorkspaceInvitationInput)
    .handler((o) => acceptWorkspaceInvitation(o.context, o.input)),

  revoke: workspaceProcedure
    .input(RevokeWorkspaceInvitationInput)
    .handler((o) => revokeWorkspaceInvitation(o.context, o.input)),
};
