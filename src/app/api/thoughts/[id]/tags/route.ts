import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const tags = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
    })
    .from(schema.thoughtTags)
    .where(eq(schema.thoughtTags.thoughtId, id))
    .innerJoin(schema.tags, eq(schema.thoughtTags.tagId, schema.tags.id));

  return NextResponse.json(tags);
}
