CREATE TYPE "public"."file_status" AS ENUM('temporary', 'in_use', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"provider_id" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accounts_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"user_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"name" varchar(255),
	"public_key" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" bigint NOT NULL,
	"device_type" varchar(50) NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "passkeys_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "two_factors" (
	"user_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "two_factors_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" bigint PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"user_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "channel_members" (
	"workspace_id" bigint NOT NULL,
	"channel_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"last_seen_message_id" bigint,
	CONSTRAINT "channel_members_workspace_id_channel_id_user_id_pk" PRIMARY KEY("workspace_id","channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"workspace_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" bigint,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "channels_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"workspace_id" bigint NOT NULL,
	"channel_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"content" text NOT NULL,
	"author_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "messages_workspace_id_channel_id_id_pk" PRIMARY KEY("workspace_id","channel_id","id")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"workspace_id" bigint NOT NULL,
	"channel_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"emoji" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reactions_workspace_id_channel_id_id_pk" PRIMARY KEY("workspace_id","channel_id","id")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"workspace_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"uploader_id" bigint,
	"url" varchar(512) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100),
	"size" bigint,
	"status" "file_status" DEFAULT 'temporary',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "files_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "message_files" (
	"workspace_id" bigint NOT NULL,
	"channel_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"file_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "message_files_workspace_id_channel_id_message_id_file_id_pk" PRIMARY KEY("workspace_id","channel_id","message_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"workspace_id" bigint NOT NULL,
	"id" bigint NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "member_role" DEFAULT 'member',
	"status" "invitation_status" DEFAULT 'pending',
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspace_invitations_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"display_name" varchar(255),
	"avatar_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"partition_key" bigint NOT NULL,
	"id" bigint NOT NULL,
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" bigint NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone,
	CONSTRAINT "outbox_partition_key_id_pk" PRIMARY KEY("partition_key","id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_workspace_id_channel_id_channels_workspace_id_id_fk" FOREIGN KEY ("workspace_id","channel_id") REFERENCES "public"."channels"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_channel_id_channels_workspace_id_id_fk" FOREIGN KEY ("workspace_id","channel_id") REFERENCES "public"."channels"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_workspace_id_channel_id_message_id_messages_workspace_id_channel_id_id_fk" FOREIGN KEY ("workspace_id","channel_id","message_id") REFERENCES "public"."messages"("workspace_id","channel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_workspace_id_file_id_files_workspace_id_id_fk" FOREIGN KEY ("workspace_id","file_id") REFERENCES "public"."files"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_workspace_id_channel_id_message_id_messages_workspace_id_channel_id_id_fk" FOREIGN KEY ("workspace_id","channel_id","message_id") REFERENCES "public"."messages"("workspace_id","channel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_id_acount_id_idx" ON "accounts" USING btree ("provider_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING hash ("token");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "channel_members_user_id_idx" ON "channel_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "reactions_message_idx" ON "reactions" USING btree ("workspace_id","channel_id","message_id");--> statement-breakpoint
CREATE INDEX "files_uploader_id_idx" ON "files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "message_files_channel_file_idx" ON "message_files" USING btree ("workspace_id","channel_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "outbox_unpublished_idx" ON "outbox" USING btree ("created_at") WHERE published_at IS NULL;