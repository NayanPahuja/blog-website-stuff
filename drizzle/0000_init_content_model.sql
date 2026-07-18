CREATE TYPE "public"."content_type" AS ENUM('thought', 'blog', 'project');--> statement-breakpoint
CREATE TABLE "blog_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"content_type" "content_type" DEFAULT 'blog' NOT NULL,
	"reading_time" integer,
	CONSTRAINT "blog_details_content_type_check" CHECK ("blog_details"."content_type" = 'blog')
);
--> statement-breakpoint
CREATE TABLE "content_images" (
	"content_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	CONSTRAINT "content_images_content_id_image_id_pk" PRIMARY KEY("content_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"content_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "content_tags_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" "content_type" NOT NULL,
	"title" text,
	"description" text,
	"content_md" text NOT NULL,
	"slug" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contents_slug_unique" UNIQUE("slug"),
	CONSTRAINT "contents_id_content_type_unique" UNIQUE("id","content_type")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"referrer" text
);
--> statement-breakpoint
CREATE TABLE "project_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"content_type" "content_type" DEFAULT 'project' NOT NULL,
	"technologies" text[],
	"architecture_md" text,
	"github_url" text,
	"demo_url" text,
	"lessons_learned_md" text,
	CONSTRAINT "project_details_content_type_check" CHECK ("project_details"."content_type" = 'project')
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_details" ADD CONSTRAINT "blog_details_content_fk" FOREIGN KEY ("content_id","content_type") REFERENCES "public"."contents"("id","content_type") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_details" ADD CONSTRAINT "project_details_content_fk" FOREIGN KEY ("content_id","content_type") REFERENCES "public"."contents"("id","content_type") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_images_one_cover_idx" ON "content_images" USING btree ("content_id") WHERE "content_images"."is_cover";--> statement-breakpoint
CREATE INDEX "contents_type_published_idx" ON "contents" USING btree ("content_type","is_published");--> statement-breakpoint
CREATE INDEX "page_views_content_time_idx" ON "page_views" USING btree ("content_id","viewed_at" DESC NULLS LAST);