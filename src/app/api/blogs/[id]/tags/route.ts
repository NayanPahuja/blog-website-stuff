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

    const tags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.tags)
      .innerJoin(schema.blogTags, eq(schema.blogTags.tagId, schema.tags.id))
      .where(eq(schema.blogTags.blogId, id));

    return NextResponse.json(tags);
  } catch (err) {
    console.error("[blog tags GET] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
