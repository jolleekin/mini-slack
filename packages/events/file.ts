import { Id } from "./core.ts";

export type FileStatus = "temporary" | "in_use" | "deleted";

export interface FileEventPayload {
  workspaceId: Id;
  id: Id;
  uploaderId: Id;
  url: string;
  name: string;
  type: string;
  size: number;
  status: FileStatus;
  createdAt: Date;
}
