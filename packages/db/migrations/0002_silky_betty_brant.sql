ALTER TABLE "workspace_invitations" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;