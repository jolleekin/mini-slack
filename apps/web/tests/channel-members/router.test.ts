import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addChannelMember,
  listChannelMembers,
  removeChannelMember,
  updateChannelMemberLastSeenMessage,
  updateChannelMemberRole,
} from "@/lib/messaging/channels/members/service.ts";
import {
  AddChannelMemberInput,
  ListChannelMembersOutput,
  UpdateChannelMemberLastSeenInput,
  UpdateChannelMemberRoleInput,
} from "@/lib/messaging/channels/members/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test.ts";

vi.mock("@/lib/messaging/channels/members/service.ts", () => ({
  addChannelMember: vi.fn(),
  listChannelMembers: vi.fn(),
  removeChannelMember: vi.fn(),
  updateChannelMemberLastSeenMessage: vi.fn(),
  updateChannelMemberRole: vi.fn(),
}));

describe("channelMemberRouter", () => {
  const workspaceId = "1000000000000001";
  const channelId = "1000000000000002";
  const userId = "2000000000000001";
  const rpc = getRpcClient(workspaceId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list lists members", async () => {
    const mockMembers: ListChannelMembersOutput = [
      {
        workspaceId,
        channelId,
        userId,
        role: "owner",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenMessageId: null,
      },
    ];
    vi.mocked(listChannelMembers).mockResolvedValue(mockMembers);

    const body = await rpc.channels.members.list({ channelId });

    expect(body[0].userId).toBe(mockMembers[0].userId);
    expect(listChannelMembers).toHaveBeenCalledWith(expect.anything(), {
      channelId,
    });
  });

  it("POST /add adds a member", async () => {
    const input: AddChannelMemberInput = {
      channelId,
      userId,
      role: "member",
    };
    vi.mocked(addChannelMember).mockResolvedValue(undefined as never);

    await rpc.channels.members.add(input);

    expect(addChannelMember).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /updateRole updates a member role", async () => {
    const input: UpdateChannelMemberRoleInput = {
      channelId,
      userId,
      role: "owner",
    };
    vi.mocked(updateChannelMemberRole).mockResolvedValue(undefined as never);

    await rpc.channels.members.updateRole(input);

    expect(updateChannelMemberRole).toHaveBeenCalledWith(
      expect.anything(),
      input,
    );
  });

  it("POST /updateLastSeen updates a member's last seen message", async () => {
    const input: UpdateChannelMemberLastSeenInput = {
      channelId,
      lastSeenMessageId: "1000000000000005",
    };
    vi.mocked(updateChannelMemberLastSeenMessage).mockResolvedValue(
      undefined as never,
    );

    await rpc.channels.members.updateLastSeen(input);

    expect(updateChannelMemberLastSeenMessage).toHaveBeenCalledWith(
      expect.anything(),
      input,
    );
  });

  it("POST /remove removes a member", async () => {
    vi.mocked(removeChannelMember).mockResolvedValue({ id: userId });

    await rpc.channels.members.remove({ channelId, userId });

    expect(removeChannelMember).toHaveBeenCalledWith(expect.anything(), {
      channelId,
      userId,
    });
  });
});
