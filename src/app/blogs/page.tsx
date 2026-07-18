import type { Metadata } from "next";
import { db, schema } from "@/db/client";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ContentListItem } from "@/components/content/content-list-item";

export const metadata: Metadata = {
  title: "Blogs — pkg/nayan",
};

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  let blogs: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    publishedAt: Date | null;
    readingTime: number | null;
  }> = [];

  try {
    blogs = await db
      .select({
        id: schema.contents.id,
        title: schema.contents.title,
        slug: schema.contents.slug,
        publishedAt: schema.contents.publishedAt,
        readingTime: schema.blogDetails.readingTime,
      })
      .from(schema.contents)
      .innerJoin(schema.blogDetails, eq(schema.blogDetails.contentId, schema.contents.id))
      .where(and(eq(schema.contents.contentType, "blog"), eq(schema.contents.isPublished, true)))
      .orderBy(desc(schema.contents.publishedAt));
  } catch {}

  const blogIds = blogs.map((b) => b.id);
  const tagsByBlog: Record<string, Array<{ name: string; slug: string }>> = {};

  if (blogIds.length > 0) {
    const rows = await db
      .select({
        contentId: schema.contentTags.contentId,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.contentTags)
      .where(inArray(schema.contentTags.contentId, blogIds))
      .innerJoin(schema.tags, eq(schema.contentTags.tagId, schema.tags.id));
    for (const row of rows) {
      if (!tagsByBlog[row.contentId]) tagsByBlog[row.contentId] = [];
      tagsByBlog[row.contentId].push({ name: row.name, slug: row.slug });
    }
  }

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
        Blogs
      </h1>
      {blogs.length === 0 && (
        <p className="text-[var(--muted)]">No published blogs yet.</p>
      )}
      <div className="post-list">
        {blogs.map((blog) => (
          <ContentListItem
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            title={blog.title ?? "Untitled"}
            date={blog.publishedAt}
            dateFallback="Draft"
            meta={blog.readingTime ? [`${blog.readingTime} min read`] : undefined}
            tags={tagsByBlog[blog.id]}
          />
        ))}
      </div>
    </div>
  );
}
