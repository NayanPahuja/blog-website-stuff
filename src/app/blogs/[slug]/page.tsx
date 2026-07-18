import { notFound } from "next/navigation";
import { db, schema } from "@/db/client";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const [blog] = await db
    .select({
      id: schema.contents.id,
      title: schema.contents.title,
      contentMd: schema.contents.contentMd,
      isPublished: schema.contents.isPublished,
      publishedAt: schema.contents.publishedAt,
      readingTime: schema.blogDetails.readingTime,
    })
    .from(schema.contents)
    .innerJoin(schema.blogDetails, eq(schema.blogDetails.contentId, schema.contents.id))
    .where(and(eq(schema.contents.slug, slug), eq(schema.contents.contentType, "blog")));

  if (!blog) notFound();
  if (!blog.isPublished && !isPreview) notFound();

  const tags = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
    })
    .from(schema.contentTags)
    .where(eq(schema.contentTags.contentId, blog.id))
    .innerJoin(schema.tags, eq(schema.contentTags.tagId, schema.tags.id));

  return (
    <article className="py-8 space-y-6">
      {isPreview && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          Preview mode — this blog is not yet published.
        </div>
      )}

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
          {blog.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-[var(--muted)] flex-wrap">
          {blog.publishedAt && (
            <time dateTime={blog.publishedAt.toISOString()}>
              {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          )}
          {blog.readingTime && (
            <>
              <span>&middot;</span>
              <span>{blog.readingTime} min read</span>
            </>
          )}
          {tags.length > 0 && (
            <>
              <span>&middot;</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="inline-block rounded-md border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--link)] hover:border-[var(--link)] transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <MarkdownRenderer content={blog.contentMd} />
    </article>
  );
}
