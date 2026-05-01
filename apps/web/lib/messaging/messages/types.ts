import * as schema from "@mini-slack/db/index.ts";
import { Id } from "@mini-slack/id-gen/index.ts";
import { z } from "zod";

const LinkNode = z.object({
  type: z.literal("link"),
  url: z.url(),
  text: z.string(),
});

const MentionNode = z.object({
  type: z.literal("mention"),
  userId: z.string(),
  /**
   * The name at the time of sending (cache).
   * Renderers should prioritize live data from a user store if available.
   */
  text: z.string(),
});

const ChannelNode = z.object({
  type: z.literal("channel"),
  channelId: z.string(),
  /**
   * The channel name at the time of sending (cache).
   * Renderers should prioritize live data from a channel store if available.
   */
  text: z.string(),
});

const TextNode = z.object({
  type: z.literal("text"),
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
  code: z.boolean().optional(),
});

const InlineNode = z.discriminatedUnion("type", [
  LinkNode,
  MentionNode,
  ChannelNode,
  TextNode,
]);

const ParagraphNode = z.object({
  type: z.literal("paragraph"),
  children: z.array(InlineNode),
});

const HeadingNode = z.object({
  type: z.literal("heading"),
  tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  children: z.array(InlineNode),
});

const QuoteNode = z.object({
  type: z.literal("quote"),
  children: z.array(ParagraphNode),
});

const ListItemNode = z.object({
  type: z.literal("listitem"),
  children: z.array(InlineNode),
});

const ListNode = z.object({
  type: z.literal("list"),
  listType: z.enum(["bullet", "number"]),
  children: z.array(ListItemNode),
});

const BlockNode = z.discriminatedUnion("type", [
  ParagraphNode,
  HeadingNode,
  QuoteNode,
  ListNode,
]);

export const RichText = z.object({
  root: z.object({
    version: z.number().optional(),
    children: z.array(BlockNode),
  }),
});

export type Message = typeof schema.messages.$inferSelect;

export type MessageType = Message["type"];

/**
 * Structured metadata stored on system messages. Clients use this to render
 * localized strings without parsing pre-rendered text.
 */
export type MessageMetadata =
  | { type: "member_added"; userId: string; name: string }
  | { type: "member_removed"; userId: string; name: string }
  | { type: "member_left"; userId: string; name: string }
  | { type: "channel_renamed"; oldName: string; newName: string }
  | {
      type: "channel_description_updated";
      oldDescription: string | null;
      newDescription: string | null;
    }
  | { type: "channel_type_updated"; oldType: string; newType: string };

/**
 * Input to insertSystemMessage. Same shape as MessageMetadata.
 */
export type SystemMessageInput = MessageMetadata;

export type MessageAuthor = {
  id: Id;
  name: string | null;
  avatarUrl: string | null;
};

export type MessageWithAuthor = Message & {
  /** Null for system messages (type !== 'message'). */
  author: MessageAuthor | null;
};

export type PendingMessage = CreateMessageInput & {
  id: Id;
  createdAt: Date;
  author: MessageAuthor;
};

export const ListMessagesInput = z.object({
  channelId: z.string(),
  before: z.string().optional(),
  limit: z.coerce.number().optional(),
});
export type ListMessagesInput = z.infer<typeof ListMessagesInput>;
export type ListMessagesOutput = MessageWithAuthor[];

export const CreateMessageInput = z.object({
  channelId: z.string(),
  richText: RichText.optional(),
  plainText: z.string().min(1, "Message content cannot be empty"),
});
export type CreateMessageInput = z.infer<typeof CreateMessageInput>;
export type CreateMessageOutput = MessageWithAuthor;

export const UpdateMessageInput = z.object({
  channelId: z.string(),
  messageId: z.string(),
  richText: RichText.optional(),
  plainText: z.string().min(1, "Message content cannot be empty"),
});
export type UpdateMessageInput = z.infer<typeof UpdateMessageInput>;
export type UpdateMessageOutput = Message;

export const DeleteMessageInput = z.object({
  channelId: z.string(),
  messageId: z.string(),
});
export type DeleteMessageInput = z.infer<typeof DeleteMessageInput>;
export type DeleteMessageOutput = { id: string };
