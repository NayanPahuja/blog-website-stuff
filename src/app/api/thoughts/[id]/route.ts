import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const [thought] = await db
    .select()
    .from(schema.contents)
    .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "thought")));

  if (!thought) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  return NextResponse.json(thought);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.trim() || null;
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.contentMd === "string") updates.contentMd = body.contentMd.trim();
  updates.updatedAt = new Date();

  if (Object.keys(updates).length === 0 && !body.tagIds) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const [thought] = await db
      .update(schema.contents)
      .set(updates)
      .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "thought")))
      .returning();

    if (!thought) {
      return NextResponse.json({ error: "Thought not found." }, { status: 404 });
    }
  }

  if (Array.isArray(body.tagIds)) {
    await db.delete(schema.contentTags).where(eq(schema.contentTags.contentId, id));

    if (body.tagIds.length > 0) {
      await db.insert(schema.contentTags).values(
        body.tagIds.map((tagId: string) => ({
          contentId: id,
          tagId,
        })),
      );
    }
  }

  const [thought] = await db
    .select()
    .from(schema.contents)
    .where(eq(schema.contents.id, id));

  return NextResponse.json(thought);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const [thought] = await db
    .delete(schema.contents)
    .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "thought")))
    .returning();

  if (!thought) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
