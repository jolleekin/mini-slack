/**
 * Core domain entities matching the database schema.
 * All IDs are 64-bit Snowflake IDs represented as strings for JSON compatibility.
 * @module
 */

export type SnowflakeIdString = string;

export interface User {
  id: SnowflakeIdString;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Links a User to an external auth provider (OAuth or Email/Password).
 */
export interface Account {
  id: SnowflakeIdString;
  userId: SnowflakeIdString;
  accountId: string; // The ID of the user in the external provider
  providerId: string; // e.g., "google", "github", "email"
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string | null;
  password?: string | null; // For credential provider
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents an active login session.
 */
export interface Session {
  id: SnowflakeIdString;
  userId: SnowflakeIdString;
  token: string; // The session token
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Used for email verification and magic links.
 */
export interface Verification {
  id: SnowflakeIdString;
  identifier: string; // email or phone number
  value: string; // The token/code
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: SnowflakeIdString;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ownerId: SnowflakeIdString;
  createdAt: Date;
}

export type WorkspaceRole = "owner" | "admin" | "member";

/**
 * Workspace membership record partitioned by workspaceId.
 * Used for workspace-level lookups (members of a workspace).
 */
export interface WorkspaceMember {
  workspaceId: SnowflakeIdString; // Partition Key
  userId: SnowflakeIdString;
  userName: string; // Mandatory per-workspace name.
  userImageUrl?: string | null; // Per-workspace avatar.
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

export type FileStatus = "temporary" | "in_use" | "deleted";

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
