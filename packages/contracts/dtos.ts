/**
 * Data Transfer Objects for API requests and responses.
 * These are types-only and do not include validation (handled by Zod in apps).
 */

import {
  SnowflakeIdString,
  User,
  Workspace,
  Channel,
  Message,
  File,
  Reaction,
} from "./entities.ts";

// --- Auth DTOs ---

/**
 * Request to send a magic link to the user's email.
 */
export interface MagicLinkRequest {
  email: string;
}

/**
 * Request to sign in using a token from a magic link.
 */
export interface MagicLinkSigninRequest {
  email: string;
  token: string;
}

export interface SigninResponse {
  user: User;
  token: string;
  refreshToken: string; // For native apps.
  workspaces: Workspace[];
}

/**
 * Request to update a user's profile within a specific workspace.
 */
export interface UpdateWorkspaceProfileRequest {
  name?: string;
  imageUrl?: string | null;
}

// --- Workspace DTOs ---

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface WorkspaceWithMemberCount extends Workspace {
  memberCount: number;
}

// --- Channel DTOs ---

export interface CreateChannelRequest {
  name: string;
}

export interface UpdateChannelRequest {
  name: string;
}

export interface ChannelWithMemberCount extends Channel {
  memberCount: number;
}

// --- Message DTOs ---

export interface CreateMessageRequest {
  content: string;
  fileIds?: SnowflakeIdString[];
}

export interface MessageWithAuthor extends Message {
  author: {
    name: string;
    imageUrl?: string | null;
  };
  files: Array<File & { messageId: SnowflakeIdString }>;
  reactions: Array<Reaction>;
}
