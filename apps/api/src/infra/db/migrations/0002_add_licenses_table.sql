CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watchface_id" uuid NOT NULL,
	"user_id" uuid,
	"device_serial" varchar(64),
	"license_key" varchar(128),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_watchface_id_watchfaces_id_fk" FOREIGN KEY ("watchface_id") REFERENCES "public"."watchfaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_device_watchface_idx" ON "licenses" USING btree ("device_serial","watchface_id");--> statement-breakpoint
CREATE INDEX "watchfaces_status_idx" ON "watchfaces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "watchfaces_designer_id_idx" ON "watchfaces" USING btree ("designer_id");