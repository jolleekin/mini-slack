import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChannel,
  deleteChannel,
  getChannel,
  listChannels,
  updateChannel,
} from "@/lib/messaging/channels/service.ts";
import {
  CreateChannelInput,
  CreateChannelOutput,
  GetChannelInput,
  GetChannelOutput,
  ListChannelsOutput,
  UpdateChannelInput,
  UpdateChannelOutput,
} from "@/lib/messaging/channels/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test.ts";

vi.mock("@/lib/messaging/channels/service.ts", () => ({
  createChannel: vi.fn(),
  deleteChannel: vi.fn(),
  getChannel: vi.fn(),
  listChannels: vi.fn(),
  updateChannel: vi.fn(),
}));

describe("channelsRouter", () => {
  const workspaceId = "1000000000000001";
  const channelId = "1000000000000002";
  const rpc = getRpcClient(workspaceId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list lists channels", async () => {
    const mockChannels: ListChannelsOutput = [
      {
        workspaceId,
        id: "1000000000000003",
        name: "general",
        role: "member",
        type: "public",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(listChannels).mockResolvedValue(mockChannels);

    const body = await rpc.channels.list({});

    expect(body).toEqual(mockChannels);
    expect(listChannels).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("POST /create creates a channel", async () => {
    const input: CreateChannelInput = {
      name: "new-channel",
      type: "public" as const,
    };
    const mockChannel: CreateChannelOutput = {
      workspaceId,
      id: "1000000000000004",
      name: input.name,
      type: input.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(createChannel).mockResolvedValue(mockChannel);

    const body = await rpc.channels.create(input);

    expect(body).toEqual(mockChannel);
    expect(createChannel).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /update updates a channel", async () => {
    const input: UpdateChannelInput = { channelId, name: "updated-channel" };
    const output: UpdateChannelOutput = {
      workspaceId,
      id: channelId,
      name: "updated-channel",
      type: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(updateChannel).mockResolvedValue(output);

    const body = await rpc.channels.update(input);

    expect(body).toEqual(output);
    expect(updateChannel).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /get returns a channel", async () => {
    const input: GetChannelInput = { channelId };
    const mockChannel: GetChannelOutput = {
      workspaceId,
      id: channelId,
      name: "general",
      type: "public",
      role: "owner",
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getChannel).mockResolvedValue(mockChannel);

    const body = await rpc.channels.get(input);

    expect(body).toEqual(mockChannel);
    expect(getChannel).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /delete deletes a channel", async () => {
    vi.mocked(deleteChannel).mockResolvedValue({ id: channelId });

    await rpc.channels.delete({ channelId });

    expect(deleteChannel).toHaveBeenCalledWith(expect.anything(), {
      channelId,
    });
  });
});
