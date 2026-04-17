export type Id = string;

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
  USER_SIGNED_IN = "USER_SIGNED_IN",
  USER_UPDATED = "USER_UPDATED",

  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  WORKSPACE_DELETED = "WORKSPACE_DELETED",
  WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
  WORKSPACE_MEMBER_ADDED = "WORKSPACE_MEMBER_ADDED",
  WORKSPACE_MEMBER_REMOVED = "WORKSPACE_MEMBER_REMOVED",

  CHANNEL_CREATED = "CHANNEL_CREATED",
  CHANNEL_UPDATED = "CHANNEL_UPDATED",
  CHANNEL_DELETED = "CHANNEL_DELETED",
  CHANNEL_MEMBER_ADDED = "CHANNEL_MEMBER_ADDED",
  CHANNEL_MEMBER_REMOVED = "CHANNEL_MEMBER_REMOVED",

  MESSAGE_CREATED = "MESSAGE_CREATED",
  MESSAGE_UPDATED = "MESSAGE_UPDATED",
  MESSAGE_DELETED = "MESSAGE_DELETED",

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
  partitionKey: Id;
  id: Id;
  actorId: Id | null;
  aggregateType: TAggregateType;
  aggregateId: Id;
  eventType: TEventType;
  payload: TPayload;
  createdAt: Date;
}
