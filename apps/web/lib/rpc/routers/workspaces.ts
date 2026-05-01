import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "@/lib/messaging/workspaces/service.ts";
import {
  CreateWorkspaceInput,
  DeleteWorkspaceInput,
  GetWorkspaceInput,
  ListWorkspacesInput,
  UpdateWorkspaceInput,
} from "@/lib/messaging/workspaces/types.ts";

import { procedure, workspaceProcedure } from "./orpc.ts";

export const workspacesRouter = {
  list: procedure
    .input(ListWorkspacesInput)
    .handler((o) => listWorkspaces(o.context, o.input)),

  get: workspaceProcedure
    .input(GetWorkspaceInput)
    .handler((o) => getWorkspace(o.context, o.input)),

  create: procedure
    .input(CreateWorkspaceInput)
    .handler((o) => createWorkspace(o.context, o.input)),

  update: workspaceProcedure
    .input(UpdateWorkspaceInput)
    .handler((o) => updateWorkspace(o.context, o.input)),

  delete: workspaceProcedure
    .input(DeleteWorkspaceInput)
    .handler((o) => deleteWorkspace(o.context, o.input)),
};
