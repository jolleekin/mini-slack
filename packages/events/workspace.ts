import { AggregateType, BaseEvent, EventType, Id } from "./core.ts";

export interface WorkspaceEventPayload {
  id: Id;
  name: string;
  slug: string;
  logoUrl?: string | null;
  createdAt: Date;
}

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMemberEventPayload {
  workspaceId: Id;
  userId: Id;
  displayName: string | null;
  avatarUrl: string | null;
  role: WorkspaceRole;
  createdAt: Date;
}

export type WorkspaceCreatedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_CREATED,
  { workspace: WorkspaceEventPayload; ownerId: Id }
>;

export type WorkspaceDeletedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_DELETED,
  { workspaceId: Id }
>;

export type WorkspaceUpdatedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_UPDATED,
  { workspace: WorkspaceEventPayload }
>;

export type WorkspaceMemberAddedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_MEMBER_ADDED,
  { member: WorkspaceMemberEventPayload }
>;

export type WorkspaceMemberRemovedEvent = BaseEvent<
  AggregateType.WORKSPACE,
  EventType.WORKSPACE_MEMBER_REMOVED,
  { workspaceId: Id; userId: Id }
>;
