CREATE TABLE "search_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "search_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"query" text NOT NULL,
	"normalized_query" text,
	"locale" text NOT NULL,
	"city" text,
	"result_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "search_logs_zero" ON "search_logs" USING btree ("created_at") WHERE "search_logs"."result_count" = 0;--> statement-breakpoint
CREATE INDEX "search_logs_created" ON "search_logs" USING btree ("created_at");