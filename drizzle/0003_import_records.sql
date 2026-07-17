CREATE TYPE "public"."import_status" AS ENUM('pending', 'imported', 'merged', 'rejected');--> statement-breakpoint
CREATE TABLE "import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_ref" text NOT NULL,
	"place_type" "place_type" NOT NULL,
	"name" jsonb NOT NULL,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"geog" geography(Point,4326) NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attribution" text,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"matched_place_id" uuid,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_matched_place_id_places_id_fk" FOREIGN KEY ("matched_place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "import_source_ref_uq" ON "import_records" USING btree ("source","source_ref");--> statement-breakpoint
CREATE INDEX "import_pending" ON "import_records" USING btree ("source","created_at") WHERE "import_records"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "import_geog_gist" ON "import_records" USING gist ("geog");