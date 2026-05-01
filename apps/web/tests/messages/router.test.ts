import { Id } from "@mini-slack/id-gen/index.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "@/lib/messaging/messages/service.ts";
import {
  CreateMessageInput,
  CreateMessageOutput,
  ListMessagesOutput,
  UpdateMessageInput,
  UpdateMessageOutput,
} from "@/lib/messaging/messages/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test.ts";

vi.mock("@/lib/messaging/messages/service.ts", () => ({
  createMessage: vi.fn(),
  deleteMessage: vi.fn(),
  listMessages: vi.fn(),
  updateMessage: vi.fn(),
}));

function createTestRichText(text: string) {
  return {
    root: {
      children: [
        {
          type: "paragraph" as const,
          children: [{ type: "text" as const, text }],
        },
      ],
    },
  };
}

describe("messagesRouter", () => {
  const workspaceId = "1000000000000001";
  const channelId = "1000000000000002";
  const messageId = "1000000000000003";
  const rpc = getRpcClient(workspaceId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list lists messages", async () => {
    const mockMessages: ListMessagesOutput = [
      {
        workspaceId,
        channelId,
        id: messageId,
        authorId: "test-user-id",
        richText: createTestRichText("Hello world"),
        plainText: "Hello world",
        type: "message" as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "test-user-id" as Id,
          name: "Test User",
          avatarUrl: null,
        },
      },
    ];
    vi.mocked(listMessages).mockResolvedValue(mockMessages);

    const body = await rpc.messages.list({
      channelId,
      before: "999",
      limit: 20,
    });

    expect(body).toEqual(mockMessages);
    expect(listMessages).toHaveBeenCalledWith(expect.anything(), {
      channelId,
      before: "999",
      limit: 20,
    });
  });

  it("POST /create creates a message", async () => {
    const input: CreateMessageInput = {
      channelId,
      richText: createTestRichText("Hello world"),
      plainText: "Hello world",
    };
    const output: CreateMessageOutput = {
      workspaceId,
      channelId,
      id: messageId,
      authorId: "test-user-id",
      richText: input.richText,
      plainText: input.plainText,
      type: "message",
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: "test-user-id",
        name: "Test User",
        avatarUrl: null,
      },
    };
    vi.mocked(createMessage).mockResolvedValue(output);

    const body = await rpc.messages.create(input);

    expect(body).toEqual(output);
    expect(createMessage).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /update updates a message", async () => {
    const input: UpdateMessageInput = {
      channelId,
      messageId,
      richText: createTestRichText("Updated message"),
      plainText: "Updated message",
    };
    const output: UpdateMessageOutput = {
      workspaceId,
      channelId,
      id: messageId,
      authorId: "test-user-id",
      richText: input.richText,
      plainText: input.plainText,
      type: "message",
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(updateMessage).mockResolvedValue(output);

    const body = await rpc.messages.update(input);

    expect(body).toEqual(output);
    expect(updateMessage).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /delete deletes a message", async () => {
    vi.mocked(deleteMessage).mockResolvedValue({ id: messageId });

    await rpc.messages.delete({ channelId, messageId });

    expect(deleteMessage).toHaveBeenCalledWith(expect.anything(), {
      channelId,
      messageId,
    });
  });
});
