CREATE TYPE "public"."channel_member_role" AS ENUM('owner', 'member');--> statement-breakpoint
ALTER TYPE "public"."member_role" RENAME TO "workspace_member_role";--> statement-breakpoint
ALTER TABLE "channel_members" ALTER COLUMN "role" DROP DEFAULT;--> manual edit
ALTER TABLE "channel_members" ALTER COLUMN "role" SET DATA TYPE "public"."channel_member_role" USING (CASE WHEN "role"::text = 'member' THEN 'member' ELSE 'owner' END)::"public"."channel_member_role";--> manual edit
ALTER TABLE "channel_members" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."channel_member_role";--> statement-breakpoint
