import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/db/client";
import { and, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tag] = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.slug, slug));

  if (!tag) notFound();

  const blogs = await db
    .select({
      id: schema.contents.id,
      title: schema.contents.title,
      slug: schema.contents.slug,
      publishedAt: schema.contents.publishedAt,
    })
    .from(schema.contentTags)
    .where(eq(schema.contentTags.tagId, tag.id))
    .innerJoin(
      schema.contents,
      and(
        eq(schema.contentTags.contentId, schema.contents.id),
        eq(schema.contents.contentType, "blog"),
        eq(schema.contents.isPublished, true),
      ),
    )
    .orderBy(desc(schema.contents.publishedAt));

  const thoughts = await db
    .select({
      id: schema.contents.id,
      title: schema.contents.title,
      description: schema.contents.description,
      updatedAt: schema.contents.updatedAt,
    })
    .from(schema.contentTags)
    .where(eq(schema.contentTags.tagId, tag.id))
    .innerJoin(
      schema.contents,
      and(
        eq(schema.contentTags.contentId, schema.contents.id),
        eq(schema.contents.contentType, "thought"),
      ),
    )
    .orderBy(desc(schema.contents.updatedAt));

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          #{tag.name}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {blogs.length + thoughts.length} {blogs.length + thoughts.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {blogs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Blogs
          </h2>
          <div className="space-y-1">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-[var(--surface)] transition-colors"
              >
                <span className="font-medium text-[var(--text)]">{blog.title}</span>
                {blog.publishedAt && (
                  <span className="text-xs text-[var(--faint)]">
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {thoughts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
            Thoughts
          </h2>
          <div className="space-y-1">
            {thoughts.map((thought) => (
              <Link
                key={thought.id}
                href={`/thoughts/${thought.id}`}
                className="block rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-[var(--surface)] transition-colors"
              >
                <p className="font-medium text-[var(--text)]">{thought.title || "Untitled"}</p>
                {thought.description && (
                  <p className="text-sm text-[var(--muted)] mt-0.5">{thought.description}</p>
                )}
                <p className="text-xs text-[var(--faint)] mt-1">
                  {new Date(thought.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {blogs.length === 0 && thoughts.length === 0 && (
        <p className="text-[var(--muted)]">No entries with this tag yet.</p>
      )}
    </div>
  );
}
