import { channelMembersRouter } from "./channel-members.ts";
import { channelsRouter } from "./channels.ts";
import { invitationsRouter } from "./invitations.ts";
import { messagesRouter } from "./messages.ts";
import { workspaceMembersRouter } from "./workspace-members.ts";
import { workspacesRouter } from "./workspaces.ts";

export const router = {
  workspaces: {
    ...workspacesRouter,
    members: workspaceMembersRouter,
    invitations: invitationsRouter,
  },
  channels: {
    ...channelsRouter,
    members: channelMembersRouter,
  },
  messages: messagesRouter,
};

export type RPCRouter = typeof router;
