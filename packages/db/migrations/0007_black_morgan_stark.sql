ALTER TABLE "messages" RENAME COLUMN "content" TO "plain_text";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "type" text DEFAULT 'message' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "rich_text" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" jsonb;