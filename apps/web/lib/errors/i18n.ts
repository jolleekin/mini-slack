const opts: ImportCallOptions = { with: { type: "json" } };

export const translationsLoaders = {
  en: () => import("./locales/en.json", opts).then((mod) => mod.default),
};

export type Locale = keyof typeof translationsLoaders;

const DEFAULT_LOCALE: Locale = "en";

export function extractLocale(headers: Headers): Locale {
  let locale = headers.get("Accept-Language")?.split(",")[0]?.split("-")[0];
  if (!locale || !(locale in translationsLoaders)) locale = DEFAULT_LOCALE;
  return locale as Locale;
}

declare module "@mini-slack/errors/index" {
  export interface AppErrorTranslationKeyMap {
    /** Channel creation failed because the name is already taken. */
    "channels.name_taken": { name: string };
    /** Channel could not be found. */
    "channels.not_found": { channelId: string };
    /** User does not have permission to view the channel. */
    "channels.cant_view": never;
    /** User does not have permission to update the channel. */
    "channels.cant_update": never;
    /** User does not have permission to delete the channel. */
    "channels.cant_delete": never;

    /** User does not have permission to add a member to the channel. */
    "channels.members.cant_add": never;
    /** User does not have permission to remove a member from the channel. */
    "channels.members.cant_remove": never;
    /** User does not have permission to update a channel member. */
    "channels.members.cant_update": never;
    /** User does not have permission to view channel members. */
    "channels.members.cant_view": never;
    /** The selected channel member could not be found. */
    "channels.members.not_found": never;
    /** The user is already a member of this channel. */
    "channels.members.already_member": never;
    /** Cannot downgrade the last owner of the channel. */
    "channels.members.cant_downgrade_last_owner": never;

    /** User does not have permission to create a message in this channel. */
    "messages.cant_create": never;
    /** The requested channel message could not be found. */
    "messages.not_found": { messageId: string };
    /** User does not have permission to update this message. */
    "messages.cant_update": { messageId: string };
    /** User does not have permission to delete this message. */
    "messages.cant_delete": { messageId: string };

    /** Workspace slug (URL) is already in use. */
    "workspaces.slug_taken": { slug: string };
    /** Workspace could not be found. */
    "workspaces.not_found": { workspaceId: string };
    /** User does not have permission to update the workspace. */
    "workspaces.cant_update": never;
    /** User does not have permission to delete the workspace. */
    "workspaces.cant_delete": never;

    /** User does not have permission to view workspace members. */
    "workspaces.members.cant_view": never;
    /** User does not have permission to update a member's role. */
    "workspaces.members.cant_update_role": never;
    /** User does not have permission to update a member's profile. */
    "workspaces.members.cant_update_profile": never;
    /** User does not have permission to remove a workspace member. */
    "workspaces.members.cant_remove": never;
    /** Cannot remove the last workspace owner. */
    "workspaces.members.cant_remove_last_owner": never;
    /** Workspace member could not be found. */
    "workspaces.members.not_found": { userId: string };
    /** The user is already a member of this workspace. */
    "workspaces.members.already_member": never;
    /** Cannot downgrade the last workspace owner. */
    "workspaces.members.cant_downgrade_last_owner": never;

    /** An invitation for this email already exists. */
    "workspaces.invitations.already_exists": { email: string };
    /** Workspace invitation could not be found. */
    "workspaces.invitations.not_found": never;
    /** The invitation can't be accepted as it is not currently pending. */
    "workspaces.invitations.not_pending": { status: string };
    /** The invitation has already expired. */
    "workspaces.invitations.expired": never;
    /** User does not have permission to create workspace invitations. */
    "workspaces.invitations.cant_create": never;
    /** User does not have permission to view workspace invitations. */
    "workspaces.invitations.cant_view": never;
    /** User does not have permission to accept this invitation. */
    "workspaces.invitations.cant_accept": never;
    /** User does not have permission to revoke this invitation. */
    "workspaces.invitations.cant_revoke": never;

    /** User must be signed in to perform this action. */
    user_auth_required: never;
    /** A workspace context is required to perform this action. */
    workspace_context_required: never;
    /** User does not have access to this workspace. */
    workspace_access_denied: never;
  }
}
