import {
  SnowflakeIdString,
  User,
  Workspace,
  WorkspaceMember,
  Channel,
  ChannelMember,
  Message,
  Reaction,
  File,
} from "./entities.ts";

/**
 * Domain Aggregate Types.
 * Represents the primary entity that an event belongs to.
 */
export enum AggregateType {
  USER = "USER",
  WORKSPACE = "WORKSPACE",
  CHANNEL = "CHANNEL",
  MESSAGE = "MESSAGE",
  REACTION = "REACTION",
  FILE = "FILE",
}

/**
 * Domain Event Types.
 * Groups events by their source domain.
 */
export enum EventType {
  // User
  USER_SIGNED_IN = "USER_SIGNED_IN",

  // Workspace
  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
  WORKSPACE_MEMBER_ADDED = "WORKSPACE_MEMBER_ADDED",
  WORKSPACE_MEMBER_REMOVED = "WORKSPACE_MEMBER_REMOVED",

  // Channel
  CHANNEL_CREATED = "CHANNEL_CREATED",
  CHANNEL_UPDATED = "CHANNEL_UPDATED",
  CHANNEL_DELETED = "CHANNEL_DELETED",
  CHANNEL_MEMBER_ADDED = "CHANNEL_MEMBER_ADDED",
  CHANNEL_MEMBER_REMOVED = "CHANNEL_MEMBER_REMOVED",

  // Message
  MESSAGE_CREATED = "MESSAGE_CREATED",
  MESSAGE_UPDATED = "MESSAGE_UPDATED",
  MESSAGE_DELETED = "MESSAGE_DELETED",

  // Reaction
  REACTION_ADDED = "REACTION_ADDED",
  REACTION_REMOVED = "REACTION_REMOVED",
}

/**
 * Base structure for all system and domain events.
 */
export interface BaseEvent<
  TAggregateType extends AggregateType,
  TEventType extends EventType,
  TPayload,
> {
  partitionKey: SnowflakeIdString;
  id: SnowflakeIdString;
  aggregateType: TAggregateType;
  aggregateId: SnowflakeIdString;
  eventType: TEventType;
  payload: TPayload;
  createdAt: Date;
}

export type UserSignedInEvent = BaseEvent<
  AggregateType.USER,
  EventType.USER_SIGNED_IN,
  { user: User }
>;

export type WorkspaceCreatedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_CREATED,
  { workspace: Workspace }
>;

export type WorkspaceUpdatedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_UPDATED,
  { workspace: Workspace }
>;

export type WorkspaceMemberAddedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_MEMBER_ADDED,
  { member: WorkspaceMember }
>;

export type WorkspaceMemberRemovedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_MEMBER_REMOVED,
  { workspaceId: SnowflakeIdString; userId: SnowflakeIdString }
>;

export type ChannelCreatedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_CREATED,
  { channel: Channel }
>;

export type ChannelUpdatedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_UPDATED,
  { channel: Channel }
>;

export type ChannelDeletedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_DELETED,
  { workspaceId: SnowflakeIdString; channelId: SnowflakeIdString }
>;

export type ChannelMemberAddedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_MEMBER_ADDED,
  { member: ChannelMember }
>;

export type ChannelMemberRemovedEvent = BaseEvent<
  AggregateType.CHANNEL,
  EventType.CHANNEL_MEMBER_REMOVED,
  {
    workspaceId: SnowflakeIdString;
    channelId: SnowflakeIdString;
    userId: SnowflakeIdString;
  }
>;

export type MessageCreatedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_CREATED,
  {
    message: Message;
    authorName: string;
    authorImageUrl?: string | null;
    files: File[];
  }
>;

export type MessageUpdatedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_UPDATED,
  {
    message: Message;
    authorName: string;
    authorImageUrl?: string | null;
    files: File[];
  }
>;

export type MessageDeletedEvent = BaseEvent<
  AggregateType.MESSAGE,
  EventType.MESSAGE_DELETED,
  {
    workspaceId: SnowflakeIdString;
    channelId: SnowflakeIdString;
    messageId: SnowflakeIdString;
  }
>;

export type ReactionAddedEvent = BaseEvent<
  AggregateType.REACTION,
  EventType.REACTION_ADDED,
  { reaction: Reaction }
>;

export type ReactionRemovedEvent = BaseEvent<
  AggregateType.REACTION,
  EventType.REACTION_REMOVED,
  { reaction: Reaction }
>;

export type AppEvent =
  | UserSignedInEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceMemberAddedEvent
  | WorkspaceMemberRemovedEvent
  | ChannelCreatedEvent
  | ChannelUpdatedEvent
  | ChannelDeletedEvent
  | ChannelMemberAddedEvent
  | ChannelMemberRemovedEvent
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | ReactionAddedEvent
  | ReactionRemovedEvent;
