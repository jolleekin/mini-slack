import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "@/lib/messaging/messages/service.ts";
import {
  CreateMessageInput,
  DeleteMessageInput,
  ListMessagesInput,
  UpdateMessageInput,
} from "@/lib/messaging/messages/types.ts";

import { workspaceProcedure } from "./orpc.ts";

export const messagesRouter = {
  list: workspaceProcedure
    .input(ListMessagesInput)
    .handler((o) => listMessages(o.context, o.input)),

  create: workspaceProcedure
    .input(CreateMessageInput)
    .handler((o) => createMessage(o.context, o.input)),

  update: workspaceProcedure
    .input(UpdateMessageInput)
    .handler((o) => updateMessage(o.context, o.input)),

  delete: workspaceProcedure
    .input(DeleteMessageInput)
    .handler((o) => deleteMessage(o.context, o.input)),
};
