import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getWorkspaceMember,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberProfile,
  updateWorkspaceMemberRole,
} from "@/lib/messaging/workspaces/members/service.ts";
import {
  ListWorkspaceMembersOutput,
  UpdateWorkspaceMemberProfileInput,
  UpdateWorkspaceMemberProfileOutput,
  UpdateWorkspaceMemberRoleInput,
  UpdateWorkspaceMemberRoleOutput,
  WorkspaceMember,
} from "@/lib/messaging/workspaces/members/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test.ts";

vi.mock("@/lib/messaging/workspaces/members/service.ts", () => ({
  listWorkspaceMembers: vi.fn(),
  getWorkspaceMember: vi.fn(),
  updateWorkspaceMemberRole: vi.fn(),
  updateWorkspaceMemberProfile: vi.fn(),
  removeWorkspaceMember: vi.fn(),
}));

describe("workspaceMembersRouter", () => {
  const workspaceId = "ws-1";
  const userId = "u-1";
  const rpc = getRpcClient(workspaceId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list lists members", async () => {
    const mockMembers: ListWorkspaceMembersOutput = [
      {
        workspaceId: "1",
        userId: "1",
        email: "u1@test.com",
        emailVerified: true,
        role: "member",
        name: "User 1",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(listWorkspaceMembers).mockResolvedValue(mockMembers);

    const body = await rpc.workspaces.members.list({});

    expect(body).toEqual(mockMembers);
    expect(listWorkspaceMembers).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("POST /get returns specific member", async () => {
    const mockMember: WorkspaceMember = {
      workspaceId: "1",
      userId: "1",
      email: "u1@test.com",
      emailVerified: true,
      role: "member",
      name: "User 1",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getWorkspaceMember).mockResolvedValue(mockMember);

    const body = await rpc.workspaces.members.get({ userId });

    expect(body).toEqual(mockMember);
    expect(getWorkspaceMember).toHaveBeenCalledWith(expect.anything(), {
      userId,
    });
  });

  it("POST /updateRole updates role", async () => {
    const input: UpdateWorkspaceMemberRoleInput = { userId, role: "admin" };
    const output: UpdateWorkspaceMemberRoleOutput = {
      workspaceId,
      userId,
      email: "u1@test.com",
      emailVerified: true,
      role: "admin",
      name: "User 1",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(updateWorkspaceMemberRole).mockResolvedValue(output);

    const body = await rpc.workspaces.members.updateRole(input);

    expect(body).toEqual(output);
    expect(updateWorkspaceMemberRole).toHaveBeenCalledWith(
      expect.anything(),
      input,
    );
  });

  it("POST /updateProfile updates profile", async () => {
    const input: UpdateWorkspaceMemberProfileInput = {
      userId,
      name: "New Name",
    };
    const output: UpdateWorkspaceMemberProfileOutput = {
      workspaceId,
      userId,
      email: "u1@test.com",
      emailVerified: true,
      role: "member",
      name: "New Name",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(updateWorkspaceMemberProfile).mockResolvedValue(output);

    const body = await rpc.workspaces.members.updateProfile(input);

    expect(body).toEqual(output);
    expect(updateWorkspaceMemberProfile).toHaveBeenCalledWith(
      expect.anything(),
      input,
    );
  });

  it("POST /remove removes member", async () => {
    vi.mocked(removeWorkspaceMember).mockResolvedValue(undefined as never);

    await rpc.workspaces.members.remove({ userId });

    expect(removeWorkspaceMember).toHaveBeenCalledWith(expect.anything(), {
      userId,
    });
  });
});
