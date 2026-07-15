CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."cert_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'pending_review', 'published', 'published_unverified', 'archived', 'removed');--> statement-breakpoint
CREATE TYPE "public"."halal_source" AS ENUM('cicot_certificate', 'owner_declaration', 'field_verification', 'community_verified', 'imported', 'none');--> statement-breakpoint
CREATE TYPE "public"."halal_status" AS ENUM('cicot_certified', 'muslim_owned', 'muslim_friendly', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('restaurant', 'mosque', 'prayer_room', 'hotel', 'attraction', 'shop', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."submission_category" AS ENUM('new_place', 'place_edit', 'place_closed', 'wrong_location', 'halal_concern', 'inappropriate_media', 'claim', 'other');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'in_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."takedown_status" AS ENUM('received', 'in_review', 'content_hidden', 'content_removed', 'rejected', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('site_visit', 'phone', 'document', 'official_registry', 'owner_attestation');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "halal_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"certifying_body" text DEFAULT 'CICOT' NOT NULL,
	"cert_number" text,
	"issued_at" date,
	"expires_at" date,
	"evidence_file_key" text,
	"status" "cert_status" DEFAULT 'pending' NOT NULL,
	"submitted_by" text,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid,
	"review_id" uuid,
	"r2_key" text NOT NULL,
	"kind" text DEFAULT 'photo' NOT NULL,
	"width" integer,
	"height" integer,
	"blur_hash" text,
	"alt" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attribution" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"body" text,
	"lang" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"risk_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "consent_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"consent_key" text NOT NULL,
	"granted" boolean NOT NULL,
	"policy_version" text NOT NULL,
	"ip" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"consenter_name" text NOT NULL,
	"consenter_role" text,
	"scope" text NOT NULL,
	"evidence_file_key" text,
	"collected_by" text,
	"consent_date" date NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"province_code" text NOT NULL,
	"center" geography(Point,4326) NOT NULL,
	"hero_media_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hero_media_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "place_type" NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"city_id" uuid,
	"district_id" uuid,
	"geog" geography(Point,4326) NOT NULL,
	"phone" text,
	"website" text,
	"line_id" text,
	"google_maps_url" text,
	"opening_hours" jsonb,
	"price_range" smallint,
	"halal_status" "halal_status" DEFAULT 'unverified' NOT NULL,
	"halal_source" "halal_source" DEFAULT 'none' NOT NULL,
	"serves_alcohol" boolean,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"avg_rating" numeric(3, 2),
	"review_count" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"data_source" text DEFAULT 'admin' NOT NULL,
	"source_ref" text,
	"translation_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_verified_at" timestamp with time zone,
	"verification_method" "verification_method",
	"verified_by" text,
	"next_review_due" timestamp with time zone,
	"disputed" boolean DEFAULT false NOT NULL,
	"owner_user_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" jsonb NOT NULL,
	"icon" text,
	"applies_to" "place_type"[] NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "amenities_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"place_type" "place_type" NOT NULL,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "place_amenities" (
	"place_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL,
	"value" boolean DEFAULT true NOT NULL,
	"detail" jsonb,
	CONSTRAINT "place_amenities_place_id_amenity_id_pk" PRIMARY KEY("place_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "place_categories" (
	"place_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "place_categories_place_id_category_id_pk" PRIMARY KEY("place_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"diff" jsonb,
	"ip" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "submission_category" NOT NULL,
	"place_id" uuid,
	"payload" jsonb NOT NULL,
	"reporter_contact" text,
	"is_confidential" boolean DEFAULT false NOT NULL,
	"submitted_by" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"assignee_id" text,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "takedown_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"requester_name" text,
	"requester_contact" text NOT NULL,
	"reason" text NOT NULL,
	"legal_reference" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sla_deadline_at" timestamp with time zone NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"status" "takedown_status" DEFAULT 'received' NOT NULL,
	"action_taken" text,
	"actioned_at" timestamp with time zone,
	"handled_by" text
);
--> statement-breakpoint
CREATE TABLE "islamic_events" (
	"key" text PRIMARY KEY NOT NULL,
	"gdate" date NOT NULL,
	"hijri_date" text,
	"title" text,
	"source" text DEFAULT 'สำนักจุฬาราชมนตรี' NOT NULL,
	"announced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prayer_times_official" (
	"province_code" text NOT NULL,
	"gdate" date NOT NULL,
	"imsak" time,
	"fajr" time NOT NULL,
	"sunrise" time,
	"dhuhr" time NOT NULL,
	"asr" time NOT NULL,
	"maghrib" time NOT NULL,
	"isha" time NOT NULL,
	"source_year" integer NOT NULL,
	"source_note" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_times_official_province_code_gdate_pk" PRIMARY KEY("province_code","gdate")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halal_certifications" ADD CONSTRAINT "halal_certifications_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halal_certifications" ADD CONSTRAINT "halal_certifications_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halal_certifications" ADD CONSTRAINT "halal_certifications_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_consents" ADD CONSTRAINT "field_consents_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_consents" ADD CONSTRAINT "field_consents_collected_by_user_id_fk" FOREIGN KEY ("collected_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenities" ADD CONSTRAINT "place_amenities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenities" ADD CONSTRAINT "place_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takedown_requests" ADD CONSTRAINT "takedown_requests_handled_by_user_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cert_expiry_idx" ON "halal_certifications" USING btree ("expires_at") WHERE "halal_certifications"."status" = 'verified';--> statement-breakpoint
CREATE INDEX "cert_place_idx" ON "halal_certifications" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "reviews_place_idx" ON "reviews" USING btree ("place_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_mod_queue" ON "reviews" USING btree ("created_at") WHERE "reviews"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "places_geog_gist" ON "places" USING gist ("geog");--> statement-breakpoint
CREATE INDEX "places_city_type" ON "places" USING btree ("city_id","type") WHERE "places"."status" IN ('published','published_unverified');--> statement-breakpoint
CREATE INDEX "places_halal" ON "places" USING btree ("halal_status") WHERE "places"."status" IN ('published','published_unverified');--> statement-breakpoint
CREATE INDEX "places_review_due" ON "places" USING btree ("next_review_due");--> statement-breakpoint
CREATE INDEX "places_name_th_trgm" ON "places" USING gin (("name"->>'th') gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "places_name_en_trgm" ON "places" USING gin (("name"->>'en') gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "places_attrs_gin" ON "places" USING gin ("attributes" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_queue" ON "submissions" USING btree ("status","category","created_at") WHERE "submissions"."status" IN ('pending','in_review');--> statement-breakpoint
CREATE INDEX "submissions_assignee" ON "submissions" USING btree ("assignee_id") WHERE "submissions"."resolved_at" IS NULL;--> statement-breakpoint
CREATE INDEX "submissions_place" ON "submissions" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "takedown_open" ON "takedown_requests" USING btree ("sla_deadline_at") WHERE "takedown_requests"."status" IN ('received','in_review');--> statement-breakpoint
CREATE INDEX "takedown_content" ON "takedown_requests" USING btree ("content_type","content_id");