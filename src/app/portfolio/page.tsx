import type { Metadata } from "next";
import { db, schema } from "@/db/client";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ContentListItem } from "@/components/content/content-list-item";

export const metadata: Metadata = {
  title: "Portfolio — pkg/nayan",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  let projects: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    description: string | null;
    publishedAt: Date | null;
    technologies: string[] | null;
  }> = [];

  try {
    projects = await db
      .select({
        id: schema.contents.id,
        title: schema.contents.title,
        slug: schema.contents.slug,
        description: schema.contents.description,
        publishedAt: schema.contents.publishedAt,
        technologies: schema.projectDetails.technologies,
      })
      .from(schema.contents)
      .innerJoin(schema.projectDetails, eq(schema.projectDetails.contentId, schema.contents.id))
      .where(and(eq(schema.contents.contentType, "project"), eq(schema.contents.isPublished, true)))
      .orderBy(desc(schema.contents.publishedAt));
  } catch {}

  const projectIds = projects.map((p) => p.id);
  const tagsByProject: Record<string, Array<{ name: string; slug: string }>> = {};

  if (projectIds.length > 0) {
    const rows = await db
      .select({
        contentId: schema.contentTags.contentId,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.contentTags)
      .where(inArray(schema.contentTags.contentId, projectIds))
      .innerJoin(schema.tags, eq(schema.contentTags.tagId, schema.tags.id));
    for (const row of rows) {
      if (!tagsByProject[row.contentId]) tagsByProject[row.contentId] = [];
      tagsByProject[row.contentId].push({ name: row.name, slug: row.slug });
    }
  }

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
        Portfolio
      </h1>
      {projects.length === 0 && (
        <p className="text-[var(--muted)]">No published projects yet.</p>
      )}
      <div className="post-list">
        {projects.map((project) => (
          <ContentListItem
            key={project.id}
            href={`/portfolio/${project.slug}`}
            title={project.title ?? "Untitled"}
            date={project.publishedAt}
            meta={project.technologies?.slice(0, 3)}
            excerpt={project.description}
            tags={tagsByProject[project.id]}
          />
        ))}
      </div>
    </div>
  );
}
