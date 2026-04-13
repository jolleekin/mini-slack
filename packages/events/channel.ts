import { AggregateType, BaseEvent, EventType, Id } from "./core.ts";

export interface ChannelEventPayload {
  workspaceId: Id;
  id: Id;
  name: string;
  createdAt: Date;
}

export type ChannelRole = "owner" | "admin" | "member";

export interface ChannelMemberEventPayload {
  workspaceId: Id;
  channelId: Id;
  userId: Id;
  role: ChannelRole;
  lastSeenMessageId?: Id | null;
}

export type ChannelCreatedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_CREATED,
  { channel: ChannelEventPayload }
>;

export type ChannelUpdatedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_UPDATED,
  { channel: ChannelEventPayload }
>;

export type ChannelDeletedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_DELETED,
  { workspaceId: Id; channelId: Id }
>;

export type ChannelMemberAddedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_MEMBER_ADDED,
  { member: ChannelMemberEventPayload }
>;

export type ChannelMemberRemovedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_MEMBER_REMOVED,
  {
    workspaceId: Id;
    channelId: Id;
    userId: Id;
  }
>;
