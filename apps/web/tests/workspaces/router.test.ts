import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "@/lib/messaging/workspaces/service.ts";
import {
  CreateWorkspaceInput,
  CreateWorkspaceOutput,
  ListWorkspacesOutput,
  UpdateWorkspaceInput,
} from "@/lib/messaging/workspaces/types.ts";
import { getRpcClient, mockSession } from "@/tests/helpers/router-test";

vi.mock("@/lib/messaging/workspaces/service.ts", () => ({
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  listWorkspaces: vi.fn(),
  updateWorkspace: vi.fn(),
}));
describe("workspacesRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
  });

  it("POST /list returns workspaces from service", async () => {
    const mockWorkspaces: ListWorkspacesOutput = [
      {
        id: "1",
        name: "Workspace 1",
        slug: "ws-1",
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "owner",
      },
      {
        id: "2",
        name: "Workspace 2",
        slug: "ws-2",
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "owner",
      },
    ];
    vi.mocked(listWorkspaces).mockResolvedValue(mockWorkspaces);

    const rpc = getRpcClient();
    const body = await rpc.workspaces.list({});

    expect(body).toEqual(mockWorkspaces);
    expect(listWorkspaces).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("POST /create creates a workspace", async () => {
    const input: CreateWorkspaceInput = {
      name: "New Workspace",
      slug: "new-ws",
      defaultChannelName: "general",
    };
    const output: CreateWorkspaceOutput = {
      workspace: {
        id: "3",
        name: input.name,
        slug: input.slug,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      defaultChannel: {
        id: "c1",
        name: input.defaultChannelName,
        type: "public",
        workspaceId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    vi.mocked(createWorkspace).mockResolvedValue(output);

    const rpc = getRpcClient();
    const body = await rpc.workspaces.create(input);

    expect(body).toEqual(output);
    expect(createWorkspace).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /update updates a workspace", async () => {
    const workspaceId = "ws-123";
    const input: UpdateWorkspaceInput = { name: "Updated Name" };
    vi.mocked(updateWorkspace).mockResolvedValue(undefined as never);

    const rpc = getRpcClient(workspaceId);
    await rpc.workspaces.update(input);

    expect(updateWorkspace).toHaveBeenCalledWith(expect.anything(), input);
  });

  it("POST /delete deletes a workspace", async () => {
    const workspaceId = "ws-123";
    vi.mocked(deleteWorkspace).mockResolvedValue({ id: workspaceId });

    const rpc = getRpcClient(workspaceId);
    await rpc.workspaces.delete({});

    expect(deleteWorkspace).toHaveBeenCalledWith(expect.anything(), {});
  });
});
