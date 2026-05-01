import * as schema from "@mini-slack/db";
import { z } from "zod";

import {
  MAX_CHANNEL_NAME_LENGTH,
  SLUG_REGEX,
} from "@/lib/messaging/constants.ts";

const ChannelType = z.enum(schema.channelTypeEnum.enumValues);

export type ChannelType = z.infer<typeof ChannelType>;

export type Channel = typeof schema.channels.$inferSelect;
export const ChannelMemberRole = z.enum(
  schema.channelMemberRoleEnum.enumValues,
);
export type ChannelMemberRole = z.infer<typeof ChannelMemberRole>;

/**
 * A channel with the requesting user's role.
 */
export type ChannelWithRole = Channel & {
  /** `null` means public channel and the user is a regular member. */
  role: ChannelMemberRole | null;
};

export type ChannelWithRoleAndMemberCount = ChannelWithRole & {
  memberCount: number;
};

export const ListChannelsInput = z.object();
export type ListChannelsInput = z.infer<typeof ListChannelsInput>;
export type ListChannelsOutput = ChannelWithRole[];

export const GetChannelInput = z.object({
  channelId: z.string(),
});
export type GetChannelInput = z.infer<typeof GetChannelInput>;
export type GetChannelOutput = ChannelWithRoleAndMemberCount;

export const CreateChannelInput = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(
      MAX_CHANNEL_NAME_LENGTH,
      `Channel name cannot be longer than ${MAX_CHANNEL_NAME_LENGTH} characters`,
    )
    .regex(
      SLUG_REGEX,
      "Channel name can only contain lowercase letters, numbers, and hyphens",
    ),
  type: ChannelType,
});
export type CreateChannelInput = z.infer<typeof CreateChannelInput>;
export type CreateChannelOutput = Channel;

export const UpdateChannelInput = z.object({
  channelId: z.string(),
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(
      MAX_CHANNEL_NAME_LENGTH,
      `Channel name cannot be longer than ${MAX_CHANNEL_NAME_LENGTH} characters`,
    )
    .regex(
      SLUG_REGEX,
      "Channel name can only contain lowercase letters, numbers, and hyphens",
    )
    .optional(),
  type: ChannelType.optional(),
});

export type UpdateChannelInput = z.infer<typeof UpdateChannelInput>;
export type UpdateChannelOutput = Channel;

export const DeleteChannelInput = z.object({
  channelId: z.string(),
});
export type DeleteChannelInput = z.infer<typeof DeleteChannelInput>;
export type DeleteChannelOutput = { id: string };
