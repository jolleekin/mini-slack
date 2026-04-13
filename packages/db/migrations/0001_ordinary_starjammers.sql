CREATE TYPE "public"."channel_type" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "id_sequences" (
	"key1" bigint NOT NULL,
	"key2" bigint NOT NULL,
	"realm" varchar(50) NOT NULL,
	"last_timestamp" bigint NOT NULL,
	"sequence" bigint NOT NULL,
	CONSTRAINT "id_sequences_key1_key2_realm_pk" PRIMARY KEY("key1","key2","realm")
);
--> statement-breakpoint
ALTER TABLE "workspace_members" RENAME COLUMN "display_name" TO "name";--> statement-breakpoint
DROP INDEX "provider_id_acount_id_idx";--> statement-breakpoint
DROP INDEX "outbox_unpublished_idx";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "passkeys" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factors" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factors" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reactions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "outbox" ALTER COLUMN "payload" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "outbox" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_members" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_members" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "type" "channel_type" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "channels_workspace_id_name_idx" ON "channels" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_id_acount_id_idx" ON "accounts" USING btree ("provider_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "outbox_unpublished_idx" ON "outbox" USING btree ("id") WHERE published_at IS NULL;--> statement-breakpoint
ALTER TABLE "channels" DROP COLUMN "owner_id";