/**
 * This module exists for testing purposes solely.
 *
 * We want to mock {@linkcode getWorkspaceMemberRole}, which is used by a
 * middleware in {@link ./routers/orpc.ts}, while avoiding duplicate mocking
 * when testing the workspace members router.
 *
 * By creating this module to re-export {@linkcode getWorkspaceMemberRole},
 * we can mock just this module instead of the whole workspace members service
 * module.
 * @module
 */
export { getWorkspaceMemberRole } from "@/lib/messaging/workspaces/members/service.ts";
