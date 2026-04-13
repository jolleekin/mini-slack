import { AggregateType, BaseEvent, EventType, Id } from "./core.ts";

export interface ReactionEventPayload {
  workspaceId: Id;
  channelId: Id;
  id: Id;
  messageId: Id;
  userId: Id;
  emoji: string;
  createdAt: Date;
}

export type ReactionAddedEvent = BaseEvent<
  AggregateType.REACTION,
  EventType.REACTION_ADDED,
  { reaction: ReactionEventPayload }
>;

export type ReactionRemovedEvent = BaseEvent<
  AggregateType.REACTION,
  EventType.REACTION_REMOVED,
  { reaction: ReactionEventPayload }
>;
