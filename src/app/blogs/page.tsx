import type { Metadata } from "next";
import { db, schema } from "@/db/client";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blogs — pkg/nayan",
};

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  let blogs: Array<{ id: string; title: string; slug: string; publishedAt: Date | null }> = [];

  try {
    blogs = await db
      .select({
        id: schema.blogs.id,
        title: schema.blogs.title,
        slug: schema.blogs.slug,
        publishedAt: schema.blogs.publishedAt,
      })
      .from(schema.blogs)
      .where(eq(schema.blogs.isPublished, true))
      .orderBy(desc(schema.blogs.publishedAt));
  } catch {}

  const blogIds = blogs.map((b) => b.id);
  const tagsByBlog: Record<string, Array<{ name: string; slug: string }>> = {};

  if (blogIds.length > 0) {
    const rows = await db
      .select({
        blogId: schema.blogTags.blogId,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.blogTags)
      .where(inArray(schema.blogTags.blogId, blogIds))
      .innerJoin(schema.tags, eq(schema.blogTags.tagId, schema.tags.id));
    for (const row of rows) {
      if (!tagsByBlog[row.blogId]) tagsByBlog[row.blogId] = [];
      tagsByBlog[row.blogId].push({ name: row.name, slug: row.slug });
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
          <article key={blog.id} className="post">
            <div className="post-meta-line">
              <time className="date" dateTime={blog.publishedAt?.toISOString() ?? ""}>
                {blog.publishedAt
                  ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Draft"}
              </time>
            </div>
            <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
            {tagsByBlog[blog.id]?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tagsByBlog[blog.id].map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="inline-block rounded px-2 py-0.5 text-xs font-medium text-[var(--faint)] hover:text-[var(--link)] transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
