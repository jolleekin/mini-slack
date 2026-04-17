import { pgEnum } from "drizzle-orm/pg-core";

export const channelTypeEnum = pgEnum("channel_type", ["public", "private"]);

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "admin",
  "member",
]);

export const channelMemberRoleEnum = pgEnum("channel_member_role", [
  "owner",
  "member",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

export const fileStatusEnum = pgEnum("file_status", [
  "temporary",
  "in_use",
  "deleted",
]);
