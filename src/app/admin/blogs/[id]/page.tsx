import { notFound } from "next/navigation";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { BlogEditor } from "./blog-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (id === "new") {
    return <BlogEditor />;
  }

  const [blog] = await db
    .select({
      id: schema.contents.id,
      title: schema.contents.title,
      slug: schema.contents.slug,
      contentMd: schema.contents.contentMd,
      isPublished: schema.contents.isPublished,
      isFeatured: schema.contents.isFeatured,
      publishedAt: schema.contents.publishedAt,
      readingTime: schema.blogDetails.readingTime,
    })
    .from(schema.contents)
    .innerJoin(schema.blogDetails, eq(schema.blogDetails.contentId, schema.contents.id))
    .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "blog")));

  if (!blog) notFound();

  return <BlogEditor blog={blog} />;
}
