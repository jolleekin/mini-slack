/**
 * Core domain entities matching the database schema.
 * All IDs are 64-bit Snowflake IDs represented as strings for JSON compatibility.
 * @module
 */

export type SnowflakeIdString = string;

export interface User {
  id: SnowflakeIdString;
  name: string;
  email: string;
  imageUrl?: string | null;
  createdAt: Date;
}

export interface Workspace {
  id: SnowflakeIdString;
  name: string;
  slug: string;
  ownerId: SnowflakeIdString;
  createdAt: Date;
}

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMember {
  workspaceId: SnowflakeIdString;
  userId: SnowflakeIdString;
  userName?: string | null; // Denormalized.
  userImageUrl?: string | null; // Denormalized.
  role: WorkspaceRole;
  createdAt: Date;
}

export interface Channel {
  workspaceId: SnowflakeIdString;
  id: SnowflakeIdString;
  name: string;
  ownerId: SnowflakeIdString;
  createdAt: Date;
}

export type ChannelRole = "owner" | "admin" | "member";

export interface ChannelMember {
  workspaceId: SnowflakeIdString;
  channelId: SnowflakeIdString;
  userId: SnowflakeIdString;
  userName?: string | null; // Denormalized.
  userImageUrl?: string | null; // Denormalized.
  role: ChannelRole;
  lastSeenMessageId?: SnowflakeIdString | null;
}

export interface Message {
  workspaceId: SnowflakeIdString;
  channelId: SnowflakeIdString;
  id: SnowflakeIdString;
  content: string;
  authorId: SnowflakeIdString | null; // null for system messages.
  createdAt: Date;
  updatedAt?: Date | null;
}

export type FileStatus = "pending" | "in_use" | "deleted";

export interface File {
  workspaceId: SnowflakeIdString;
  id: SnowflakeIdString;
  uploaderId: SnowflakeIdString;
  url: string;
  name: string;
  type: string;
  size: number;
  status: FileStatus;
  createdAt: Date;
}

export interface MessageFile {
  workspaceId: SnowflakeIdString;
  channelId: SnowflakeIdString;
  messageId: SnowflakeIdString;
  fileId: SnowflakeIdString;
  createdAt: Date;
}

export interface Reaction {
  workspaceId: SnowflakeIdString;
  channelId: SnowflakeIdString;
  id: SnowflakeIdString;
  messageId: SnowflakeIdString;
  userId: SnowflakeIdString;
  emoji: string;
  createdAt: Date;
}
