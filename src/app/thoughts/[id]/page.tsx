import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

export const dynamic = "force-dynamic";

export default async function ThoughtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [thought] = await db
    .select()
    .from(schema.thoughts)
    .where(eq(schema.thoughts.id, id));

  if (!thought) notFound();

  // Fetch tags for this thought
  const tags = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
    })
    .from(schema.thoughtTags)
    .where(eq(schema.thoughtTags.thoughtId, id))
    .innerJoin(schema.tags, eq(schema.thoughtTags.tagId, schema.tags.id));

  return (
    <article className="py-8 space-y-6">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
          {thought.title || "Untitled thought"}
        </h1>
        
        {thought.description && (
          <p className="text-lg text-[var(--muted)] border-l-4 border-[var(--border)] pl-4">
            {thought.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <time dateTime={thought.updatedAt.toISOString()}>
            {new Date(thought.updatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          
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
                      {tag.name}
                    </Link>
                  ))}
              </div>
            </>
          )}
        </div>
      </header>

      <MarkdownRenderer content={thought.contentMd} />
    </article>
  );
}
