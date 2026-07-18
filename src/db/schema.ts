/**
 * Drizzle schema for Personal Knowledge Garden.
 *
 * Single-table-inheritance content model: `contents` holds every piece of
 * writing (thought, blog, project) with shared fields (title, body, publish
 * state). Type-specific fields live in `blog_details` / `project_details`,
 * keyed 1:1 on `contents.id` and FK-guarded so a `blog_details` row can only
 * ever attach to a `contents` row where `content_type = 'blog'`.
 *
 * Publishing is an in-place transition, not a copy: a thought becomes a blog
 * by flipping `content_type` to 'blog', inserting a `blog_details` row, and
 * setting `slug` + `is_published` + `published_at`. Same row throughout —
 * no separate origin/copy bookkeeping.
 *
 * NOTE: Row-Level Security (RLS) policies are applied at the Postgres level
 * (via Supabase), not here. This file defines shape only.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  bigserial,
  timestamp,
  boolean,
  primaryKey,
  pgEnum,
  unique,
  uniqueIndex,
  index,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contentType = pgEnum("content_type", ["thought", "blog", "project"]);

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentType: contentType("content_type").notNull(),
    title: text("title"),
    description: text("description"),
    contentMd: text("content_md").notNull(),
    slug: text("slug").unique(), // null allowed: private thoughts don't need one
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // lets extension tables FK against (id, content_type), so a blog_details
    // row can never attach to a row that isn't actually type='blog'
    unique("contents_id_content_type_unique").on(t.id, t.contentType),
    index("contents_type_published_idx").on(t.contentType, t.isPublished),
  ],
);

// --- Type-specific extension tables (1:1 with contents) ---

export const blogDetails = pgTable(
  "blog_details",
  {
    contentId: uuid("content_id").primaryKey(),
    contentType: contentType("content_type").notNull().default("blog"),
    readingTime: integer("reading_time"),
  },
  (t) => [
    foreignKey({
      name: "blog_details_content_fk",
      columns: [t.contentId, t.contentType],
      foreignColumns: [contents.id, contents.contentType],
    }).onDelete("cascade"),
    check("blog_details_content_type_check", sql`${t.contentType} = 'blog'`),
  ],
);

export const projectDetails = pgTable(
  "project_details",
  {
    contentId: uuid("content_id").primaryKey(),
    contentType: contentType("content_type").notNull().default("project"),
    technologies: text("technologies").array(),
    architectureMd: text("architecture_md"),
    githubUrl: text("github_url"),
    demoUrl: text("demo_url"),
    lessonsLearnedMd: text("lessons_learned_md"),
  },
  (t) => [
    foreignKey({
      name: "project_details_content_fk",
      columns: [t.contentId, t.contentType],
      foreignColumns: [contents.id, contents.contentType],
    }).onDelete("cascade"),
    check("project_details_content_type_check", sql`${t.contentType} = 'project'`),
  ],
);

// --- Shared tags, images, analytics — one of each, ever ---

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentTags = pgTable(
  "content_tags",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.tagId] })],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  storagePath: text("storage_path").notNull(), // Supabase Storage path
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentImages = pgTable(
  "content_images",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.contentId, t.imageId] }),
    uniqueIndex("content_images_one_cover_idx")
      .on(t.contentId)
      .where(sql`${t.isCover}`),
  ],
);

export const pageViews = pgTable(
  "page_views",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
    referrer: text("referrer"),
  },
  (t) => [index("page_views_content_time_idx").on(t.contentId, t.viewedAt.desc())],
);

// ---------------------------------------------------------------------------
// Type exports (inferred from schema) — used across API + UI layers.
// ---------------------------------------------------------------------------

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;

export type BlogDetails = typeof blogDetails.$inferSelect;
export type NewBlogDetails = typeof blogDetails.$inferInsert;

export type ProjectDetails = typeof projectDetails.$inferSelect;
export type NewProjectDetails = typeof projectDetails.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
