import {
  addChannelMember,
  getChannelMember,
  listChannelMembers,
  removeChannelMember,
  updateChannelMemberLastSeenMessage,
  updateChannelMemberRole,
} from "@/lib/messaging/channels/members/service.ts";
import {
  AddChannelMemberInput,
  GetChannelMemberInput,
  ListChannelMembersInput,
  RemoveChannelMemberInput,
  UpdateChannelMemberLastSeenInput,
  UpdateChannelMemberRoleInput,
} from "@/lib/messaging/channels/members/types.ts";

import { workspaceProcedure } from "./orpc.ts";

export const channelMembersRouter = {
  list: workspaceProcedure
    .input(ListChannelMembersInput)
    .handler((o) => listChannelMembers(o.context, o.input)),

  get: workspaceProcedure
    .input(GetChannelMemberInput)
    .handler((o) => getChannelMember(o.context, o.input)),

  add: workspaceProcedure
    .input(AddChannelMemberInput)
    .handler((o) => addChannelMember(o.context, o.input)),

  updateRole: workspaceProcedure
    .input(UpdateChannelMemberRoleInput)
    .handler((o) => updateChannelMemberRole(o.context, o.input)),

  updateLastSeen: workspaceProcedure
    .input(UpdateChannelMemberLastSeenInput)
    .handler((o) => updateChannelMemberLastSeenMessage(o.context, o.input)),

  remove: workspaceProcedure
    .input(RemoveChannelMemberInput)
    .handler((o) => removeChannelMember(o.context, o.input)),
};
