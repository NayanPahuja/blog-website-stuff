import { notFound } from "next/navigation";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
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
    .select()
    .from(schema.blogs)
    .where(eq(schema.blogs.id, id));

  if (!blog) notFound();

  return <BlogEditor blog={blog} />;
}
