"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { TagInput } from "@/components/tags/tag-input";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type Blog = {
  id: string;
  title: string | null;
  slug: string | null;
  contentMd: string;
  readingTime: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
};

export function BlogEditor({ blog }: { blog?: Blog }) {
  const router = useRouter();
  const isNew = !blog;
  const [title, setTitle] = useState(blog?.title ?? "");
  const [slug, setSlug] = useState(blog?.slug ?? "");
  const [contentMd, setContentMd] = useState(blog?.contentMd ?? "");
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPublished, setIsPublished] = useState(blog?.isPublished ?? false);

  // Load existing tags for the blog
  useEffect(() => {
    if (!blog) return;
    async function loadTags() {
      try {
        const res = await fetch(`/api/blogs/${blog!.id}/tags`);
        if (res.ok) {
          const data = await res.json();
          setTags(data);
        }
      } catch {}
    }
    loadTags();
  }, [blog]);

  const handleSave = useCallback(
    async (md?: string, publish?: boolean) => {
      setSaving(true);
      setSaved(false);

      // Calculate reading time
      const content = md ?? contentMd;
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        contentMd: content,
        readingTime,
        isPublished: publish !== undefined ? publish : isPublished,
        tagIds: tags.map((t) => t.id),
      };

      if (!payload.title) {
        alert("Title is required");
        setSaving(false);
        return;
      }

      if (!payload.slug) {
        alert("Slug is required");
        setSaving(false);
        return;
      }

      try {
        let res;
        if (isNew) {
          res = await fetch("/api/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            router.push(`/admin/blogs/${data.id}`);
            router.refresh();
            return;
          }
        } else {
          res = await fetch(`/api/blogs/${blog.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (res.ok) {
          setSaved(true);
          if (publish !== undefined) {
            setIsPublished(publish);
          }
          router.refresh();
          setTimeout(() => setSaved(false), 2000);
        } else {
          const data = await res.json();
          alert(data.error ?? "Failed to save.");
        }
      } catch {
        alert("Network error.");
      } finally {
        setSaving(false);
      }
    },
    [title, slug, contentMd, tags, isPublished, isNew, blog, router],
  );

  const handleAutoSave = useCallback(
    (md: string) => {
      setContentMd(md);
      if (!isNew && blog) {
        const timer = setTimeout(() => {
          const wordCount = md.split(/\s+/).length;
          const readingTime = Math.ceil(wordCount / 200);
          
          fetch(`/api/blogs/${blog.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentMd: md,
              title: title.trim(),
              slug: slug.trim(),
              readingTime,
              isPublished,
              tagIds: tags.map((t) => t.id),
            }),
          }).catch(() => {});
        }, 2000);
        return () => clearTimeout(timer);
      }
    },
    [isNew, blog, title, slug, isPublished, tags],
  );

  const handlePublishToggle = () => {
    handleSave(undefined, !isPublished);
  };

  const handlePreview = () => {
    if (blog) {
      window.open(`/blogs/${blog.slug}?preview=true`, "_blank");
    }
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            {isNew ? "New blog post" : "Edit blog post"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Status: <span className="font-medium">{isPublished ? "Published" : "Draft"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {blog && (
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-md bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            >
              👁️ Preview
            </button>
          )}
          {!isNew && (
            <button
              type="button"
              onClick={handlePublishToggle}
              disabled={saving}
              className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                isPublished
                  ? "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                  : "bg-green-600 text-[var(--bg)] hover:bg-green-700"
              } disabled:opacity-50`}
            >
              {isPublished ? "Unpublish" : "Publish"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-md bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving..." : saved ? "Saved!" : isNew ? "Create Draft" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Blog title"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-lg font-medium text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          placeholder="url-slug"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-mono text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-2">
            Tags
          </label>
          <TagInput selected={tags} onChange={setTags} />
        </div>

        <MarkdownEditor
          initialContent={blog?.contentMd ?? ""}
          onChange={handleAutoSave}
          onSave={(md) => handleSave(md)}
          placeholder="Write your blog post..."
          saving={saving}
        />
      </div>
    </div>
  );
}
