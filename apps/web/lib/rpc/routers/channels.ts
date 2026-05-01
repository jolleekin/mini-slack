import {
  createChannel,
  deleteChannel,
  getChannel,
  listChannels,
  updateChannel,
} from "@/lib/messaging/channels/service.ts";
import {
  CreateChannelInput,
  DeleteChannelInput,
  GetChannelInput,
  ListChannelsInput,
  UpdateChannelInput,
} from "@/lib/messaging/channels/types.ts";

import { workspaceProcedure } from "./orpc.ts";

export const channelsRouter = {
  list: workspaceProcedure
    .input(ListChannelsInput)
    .handler((o) => listChannels(o.context, o.input)),

  get: workspaceProcedure
    .input(GetChannelInput)
    .handler((o) => getChannel(o.context, o.input)),

  create: workspaceProcedure
    .input(CreateChannelInput)
    .handler((o) => createChannel(o.context, o.input)),

  update: workspaceProcedure
    .input(UpdateChannelInput)
    .handler((o) => updateChannel(o.context, o.input)),

  delete: workspaceProcedure
    .input(DeleteChannelInput)
    .handler((o) => deleteChannel(o.context, o.input)),
};
