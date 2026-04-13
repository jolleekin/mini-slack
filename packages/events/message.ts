import { AggregateType, BaseEvent, EventType, Id } from "./core.ts";

export interface MessageAuthor {
  id: Id;
  name: string | null;
  avatarUrl?: string | null;
}

export interface MessageEventPayload {
  workspaceId: Id;
  channelId: Id;
  id: Id;
  content: string;
  authorId: Id | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export type MessageCreatedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_CREATED,
  {
    message: MessageEventPayload;
    author: MessageAuthor;
  }
>;

export type MessageUpdatedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_UPDATED,
  {
    message: MessageEventPayload;
  }
>;

export type MessageDeletedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_DELETED,
  {
    workspaceId: Id;
    channelId: Id;
    id: Id;
  }
>;
