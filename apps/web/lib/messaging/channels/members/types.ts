import * as schema from "@mini-slack/db";
import { z } from "zod";

const ChannelMemberRole = z.enum(["owner", "member"]);
export type ChannelMemberRole = z.infer<typeof ChannelMemberRole>;

export type ChannelMember = typeof schema.channelMembers.$inferSelect;

export const ListChannelMembersInput = z.object({
  channelId: z.string(),
});
export type ListChannelMembersInput = z.infer<typeof ListChannelMembersInput>;
export type ListChannelMembersOutput = ChannelMember[];

export const GetChannelMemberInput = z.object({
  channelId: z.string(),
  userId: z.string(),
});
export type GetChannelMemberInput = z.infer<typeof GetChannelMemberInput>;
export type GetChannelMemberOutput = ChannelMember;

export const AddChannelMemberInput = z.object({
  channelId: z.string(),
  userId: z.string(),
  role: ChannelMemberRole.default("member"),
});
export type AddChannelMemberInput = z.infer<typeof AddChannelMemberInput>;
export type AddChannelMemberOutput = ChannelMember;

export const UpdateChannelMemberRoleInput = z.object({
  channelId: z.string(),
  userId: z.string(),
  role: ChannelMemberRole,
});
export type UpdateChannelMemberRoleInput = z.infer<
  typeof UpdateChannelMemberRoleInput
>;
export type UpdateChannelMemberRoleOutput = ChannelMember;

export const UpdateChannelMemberLastSeenInput = z.object({
  channelId: z.string(),
  lastSeenMessageId: z.string(),
});
export type UpdateChannelMemberLastSeenInput = z.infer<
  typeof UpdateChannelMemberLastSeenInput
>;
export type UpdateChannelMemberLastSeenOutput = ChannelMember;

export const RemoveChannelMemberInput = z.object({
  channelId: z.string(),
  userId: z.string(),
});
export type RemoveChannelMemberInput = z.infer<typeof RemoveChannelMemberInput>;
export type RemoveChannelMemberOutput = { id: string };
