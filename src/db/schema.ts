/**
 * Drizzle schema for Personal Knowledge Garden.
 * Mirrors TRD §4 (Data Model). Tables: tags, thoughts, blogs, projects,
 * thought_tags, blog_tags, project_tags, images, page_views.
 *
 * NOTE: Row-Level Security (RLS) policies are applied at the Postgres level
 * (via Supabase), not here. This file defines shape only. See PLAN.md and
 * the per-phase migrations for RLS policy SQL.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * thought.status lifecycle:
 *   private -> published_as_blog | published_as_project
 * Once a thought is published it points back at its published record via
 * `published_ref` (blogs.id or projects.id).
 */
export const thoughtStatus = pgEnum("thought_status", [
  "private",
  "published_as_blog",
  "published_as_project",
]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const thoughts = pgTable("thoughts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"), // optional per PRD
  description: text("description"), // short description/summary
  contentMd: text("content_md").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  status: thoughtStatus("status").default("private").notNull(),
  // Points to the blog or project this thought became once published.
  // (blogs.id or projects.id — no single-table FK constraint; enforced in app logic.)
  publishedRef: uuid("published_ref"),
});

export const blogs = pgTable("blogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  thoughtId: uuid("thought_id").references(() => thoughts.id), // origin, nullable if written directly
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  contentMd: text("content_md").notNull(),
  readingTime: integer("reading_time"), // computed on save (minutes)
  isPublished: boolean("is_published").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // home page flag (Phase 5)
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  thoughtId: uuid("thought_id").references(() => thoughts.id),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  technologies: text("technologies").array(),
  architectureMd: text("architecture_md"),
  githubUrl: text("github_url"),
  demoUrl: text("demo_url"),
  lessonsLearnedMd: text("lessons_learned_md"),
  isPublished: boolean("is_published").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // home page flag (Phase 5)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Tag junctions (tags work across all three content types) ---

export const thoughtTags = pgTable(
  "thought_tags",
  {
    thoughtId: uuid("thought_id")
      .notNull()
      .references(() => thoughts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.thoughtId, t.tagId] })],
);

export const blogTags = pgTable(
  "blog_tags",
  {
    blogId: uuid("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.blogId, t.tagId] })],
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  storagePath: text("storage_path").notNull(), // Supabase Storage path
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pageViews = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  blogId: uuid("blog_id").references(() => blogs.id),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  referrer: text("referrer"),
});

// ---------------------------------------------------------------------------
// Type exports (inferred from schema) — used across API + UI layers.
// ---------------------------------------------------------------------------

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Thought = typeof thoughts.$inferSelect;
export type NewThought = typeof thoughts.$inferInsert;

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
