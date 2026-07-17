import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [blog] = await db
      .select()
      .from(schema.blogs)
      .where(eq(schema.blogs.id, id));

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("[blog GET] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { title, slug, contentMd, readingTime, isPublished, isFeatured, tagIds } =
      await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) {
      // Check if slug is taken by another blog
      const [existing] = await db
        .select()
        .from(schema.blogs)
        .where(eq(schema.blogs.slug, slug.trim()));

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "A blog with this slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = slug.trim();
    }
    if (contentMd !== undefined) updateData.contentMd = contentMd.trim();
    if (readingTime !== undefined) updateData.readingTime = readingTime;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    
    // Handle publish status change
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished) {
        // Set published date if not already set
        const [currentBlog] = await db
          .select()
          .from(schema.blogs)
          .where(eq(schema.blogs.id, id));
        
        if (currentBlog && !currentBlog.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    const [blog] = await db
      .update(schema.blogs)
      .set(updateData)
      .where(eq(schema.blogs.id, id))
      .returning();

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tags
      await db.delete(schema.blogTags).where(eq(schema.blogTags.blogId, id));

      // Insert new tags
      if (tagIds.length > 0) {
        await db.insert(schema.blogTags).values(
          tagIds.map((tagId: string) => ({
            blogId: id,
            tagId,
          }))
        );
      }
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("[blog PATCH] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.delete(schema.blogs).where(eq(schema.blogs.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[blog DELETE] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
