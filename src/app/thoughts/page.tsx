import Link from "next/link";
import { db, schema } from "@/db/client";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ThoughtsPage() {
  const thoughts = await db
    .select({
      id: schema.thoughts.id,
      title: schema.thoughts.title,
      description: schema.thoughts.description,
      contentMd: schema.thoughts.contentMd,
      createdAt: schema.thoughts.createdAt,
      updatedAt: schema.thoughts.updatedAt,
      status: schema.thoughts.status,
    })
    .from(schema.thoughts)
    .orderBy(desc(schema.thoughts.updatedAt));

  const thoughtIds = thoughts.map((t) => t.id);
  const tagsByThought: Record<string, Array<{ name: string; slug: string }>> = {};

  if (thoughtIds.length > 0) {
    const rows = await db
      .select({
        thoughtId: schema.thoughtTags.thoughtId,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.thoughtTags)
      .where(inArray(schema.thoughtTags.thoughtId, thoughtIds))
      .innerJoin(schema.tags, eq(schema.thoughtTags.tagId, schema.tags.id));
    for (const row of rows) {
      if (!tagsByThought[row.thoughtId]) tagsByThought[row.thoughtId] = [];
      tagsByThought[row.thoughtId].push({ name: row.name, slug: row.slug });
    }
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Thoughts
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {thoughts.length} {thoughts.length === 1 ? "thought" : "thoughts"}
        </p>
      </div>

      {thoughts.length === 0 && (
        <p className="text-[var(--muted)]">No thoughts published yet.</p>
      )}

      <div className="space-y-6">
        {thoughts.map((thought) => (
          <article
            key={thought.id}
            className="rounded-lg border border-[var(--border)] p-6 hover:bg-[var(--surface)] transition-colors"
          >
            <Link href={`/thoughts/${thought.id}`}>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
                {thought.title || "Untitled thought"}
              </h2>
              <p className="text-sm text-[var(--faint)] mb-3">
                {new Date(thought.updatedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {thought.description && (
                <p className="text-[var(--muted)] mb-2">
                  {thought.description}
                </p>
              )}
              <p className="text-[var(--muted)] line-clamp-3">
                {thought.contentMd.slice(0, 200)}
                {thought.contentMd.length > 200 ? "..." : ""}
              </p>
            </Link>
            {tagsByThought[thought.id]?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tagsByThought[thought.id].map((tag) => (
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
