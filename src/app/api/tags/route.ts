import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq, ilike, asc } from "drizzle-orm";
import slug from "slug";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const conditions = [];
  if (q) {
    conditions.push(ilike(schema.tags.name, `%${q}%`));
  }

  const tags = await db
    .select()
    .from(schema.tags)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(asc(schema.tags.name));

  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Tag name is required." }, { status: 400 });
  }

  const tagSlug = slug(name);

  const existing = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.slug, tagSlug))
    .then((r) => r[0]);

  if (existing) {
    return NextResponse.json(existing);
  }

  const [tag] = await db
    .insert(schema.tags)
    .values({ name, slug: tagSlug })
    .returning();

  return NextResponse.json(tag, { status: 201 });
}
