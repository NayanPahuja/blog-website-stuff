import Link from "next/link";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireAdmin();

  const blogs = await db
    .select()
    .from(schema.blogs)
    .orderBy(desc(schema.blogs.updatedAt));

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Blog Posts
        </h1>
        <Link
          href="/admin/blogs/new"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors"
          aria-label="New blog post"
          title="New blog post"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
        </Link>
      </div>

      <div className="space-y-4">
        {blogs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No blog posts yet. Create one from a thought or start from scratch.
          </p>
        ) : (
          blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/admin/blogs/${blog.id}`}
              className="block rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-[var(--text)]">
                    {blog.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {blog.slug}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-[var(--faint)]">
                    <span>
                      Updated {new Date(blog.updatedAt).toLocaleDateString()}
                    </span>
                    {blog.readingTime && <span>{blog.readingTime} min read</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      blog.isPublished
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {blog.isPublished ? "Published" : "Draft"}
                  </span>
                  {blog.isFeatured && (
                    <span className="inline-block rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
