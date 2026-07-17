import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import slug from "slug";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { type } = await request.json();

    if (type !== "blog" && type !== "project") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Get the thought
    const [thought] = await db
      .select()
      .from(schema.thoughts)
      .where(eq(schema.thoughts.id, id));

    if (!thought) {
      return NextResponse.json({ error: "Thought not found" }, { status: 404 });
    }

    if (thought.status !== "private") {
      return NextResponse.json(
        { error: "Thought is already published" },
        { status: 400 }
      );
    }

    if (!thought.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required for publishing" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const baseSlug = slug(thought.title.trim().toLowerCase());
    
    if (type === "blog") {
      // Check if slug exists
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const [existing] = await db
          .select()
          .from(schema.blogs)
          .where(eq(schema.blogs.slug, finalSlug))
          .limit(1);
        
        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Calculate reading time (rough estimate: 200 words per minute)
      const wordCount = thought.contentMd.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // Create blog
      const [blog] = await db
        .insert(schema.blogs)
        .values({
          thoughtId: thought.id,
          title: thought.title,
          slug: finalSlug,
          contentMd: thought.contentMd,
          readingTime,
          isPublished: false, // Start as draft
          isFeatured: false,
        })
        .returning();

      // Copy tags from thought to blog
      const thoughtTags = await db
        .select({ tagId: schema.thoughtTags.tagId })
        .from(schema.thoughtTags)
        .where(eq(schema.thoughtTags.thoughtId, thought.id));

      if (thoughtTags.length > 0) {
        await db.insert(schema.blogTags).values(
          thoughtTags.map((t) => ({
            blogId: blog.id,
            tagId: t.tagId,
          }))
        );
      }

      // Update thought status
      await db
        .update(schema.thoughts)
        .set({
          status: "published_as_blog",
          publishedRef: blog.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.thoughts.id, thought.id));

      return NextResponse.json({ blogId: blog.id, slug: finalSlug });
    } else {
      // type === "project"
      // Check if slug exists
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const [existing] = await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.slug, finalSlug))
          .limit(1);
        
        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create project
      const [project] = await db
        .insert(schema.projects)
        .values({
          thoughtId: thought.id,
          name: thought.title,
          slug: finalSlug,
          description: thought.description,
          architectureMd: thought.contentMd,
          isPublished: false, // Start as draft
          isFeatured: false,
        })
        .returning();

      // Copy tags from thought to project
      const thoughtTags = await db
        .select({ tagId: schema.thoughtTags.tagId })
        .from(schema.thoughtTags)
        .where(eq(schema.thoughtTags.thoughtId, thought.id));

      if (thoughtTags.length > 0) {
        await db.insert(schema.projectTags).values(
          thoughtTags.map((t) => ({
            projectId: project.id,
            tagId: t.tagId,
          }))
        );
      }

      // Update thought status
      await db
        .update(schema.thoughts)
        .set({
          status: "published_as_project",
          publishedRef: project.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.thoughts.id, thought.id));

      return NextResponse.json({ projectId: project.id, slug: finalSlug });
    }
  } catch (err) {
    console.error("[publish] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
