ALTER TABLE "places" ADD COLUMN "featured_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "featured_note" text;--> statement-breakpoint
CREATE INDEX "places_featured" ON "places" USING btree ("featured_until") WHERE "places"."status" IN ('published','published_unverified');