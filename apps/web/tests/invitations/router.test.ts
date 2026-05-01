import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  revokeWorkspaceInvitation,
} from "@/lib/messaging/workspaces/invitations/service.ts";
import {
  AcceptWorkspaceInvitationOutput,
  CreateWorkspaceInvitationInput,
  CreateWorkspaceInvitationOutput,
  ListWorkspaceInvitationsOutput,
  RevokeWorkspaceInvitationOutput,
} from "@/lib/messaging/workspaces/invitations/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test";

vi.mock("@/lib/messaging/workspaces/invitations/service.ts", () => ({
  acceptWorkspaceInvitation: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  revokeWorkspaceInvitation: vi.fn(),
}));

describe("invitationsRouter", () => {
  const workspaceId = "ws-1";
  const invitationId = "inv-1";
  const rpc = getRpcClient(workspaceId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list lists invitations", async () => {
    const mockInvites: ListWorkspaceInvitationsOutput = [
      {
        id: "1",
        email: "cat@test.com",
        status: "pending",
        workspaceId: "1",
        role: "member",
        createdAt: new Date(),
        expiresAt: new Date(),
        inviterId: "1",
      },
    ];
    vi.mocked(listWorkspaceInvitations).mockResolvedValue(mockInvites);

    const body = await rpc.workspaces.invitations.list({});

    expect(body).toEqual(mockInvites);
    expect(listWorkspaceInvitations).toHaveBeenCalledWith(
      expect.anything(),
      {},
    );
  });

  it("POST /create creates invitation", async () => {
    const input: CreateWorkspaceInvitationInput = {
      email: "cat@test.com",
      role: "member",
    };
    const output: CreateWorkspaceInvitationOutput = {
      id: invitationId,
      workspaceId,
      email: input.email,
      role: input.role,
      inviterId: "u-1",
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    vi.mocked(createWorkspaceInvitation).mockResolvedValue(output);

    const body = await rpc.workspaces.invitations.create(input);

    expect(body).toEqual(output);
    expect(createWorkspaceInvitation).toHaveBeenCalledWith(
      expect.anything(),
      input,
    );
  });

  it("POST /accept accepts invitation", async () => {
    const output: AcceptWorkspaceInvitationOutput = {
      workspaceId,
      userId: "u-2",
      email: "cat@test.com",
      emailVerified: true,
      role: "member",
      name: "Cat",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(acceptWorkspaceInvitation).mockResolvedValue(output);

    const body = await rpc.workspaces.invitations.accept({ invitationId });

    expect(body).toEqual(output);
    expect(acceptWorkspaceInvitation).toHaveBeenCalledWith(expect.anything(), {
      invitationId,
    });
  });

  it("POST /revoke revokes invitation", async () => {
    const output: RevokeWorkspaceInvitationOutput = {
      id: invitationId,
      workspaceId,
      email: "cat@test.com",
      role: "member",
      inviterId: "u-1",
      status: "rejected",
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    vi.mocked(revokeWorkspaceInvitation).mockResolvedValue(output);

    const body = await rpc.workspaces.invitations.revoke({ invitationId });

    expect(body).toEqual(output);
    expect(revokeWorkspaceInvitation).toHaveBeenCalledWith(expect.anything(), {
      invitationId,
    });
  });
});
