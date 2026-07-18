"use client";

import "edra-react/styles/editor.css";
import "edra-react/styles/onedark.css";

import { useEffect, useRef } from "react";
import { createEditor, Edra } from "edra-react";
// Type-only import, erased at compile time — pulls in @tiptap/markdown's
// ambient module augmentation of `Editor`/`SetContentOptions` (adds
// `getMarkdown()` and the `contentType` option) so TS recognizes them below.
// edra-react uses @tiptap/markdown internally but doesn't re-export this
// augmentation from its own .d.ts, so consumers must import it directly.
import type {} from "@tiptap/markdown";

/**
 * edra-react's `uploadMedia` command throws synchronously if no onUpload
 * handler is registered at all (no /api/upload route exists yet). Supplying
 * a stub that rejects routes the failure through the extension's own
 * .catch(console.error) instead of crashing the editor.
 */
async function uploadNotConfigured(): Promise<string> {
  throw new Error("Image upload is not configured yet.");
}

export function MarkdownEditor({
  initialContent = "",
  onChange,
  onSave,
  saving,
}: {
  initialContent?: string;
  onChange?: (md: string) => void;
  onSave?: (md: string) => void;
  placeholder?: string;
  saving: boolean;
}) {
  const editor = createEditor({ onFileUpload: uploadNotConfigured });

  // Load initial content once, after mount — deferred a tick to dodge a
  // flushSync warning, mirroring edra-react's own reference example.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!editor || loadedRef.current) return;
    loadedRef.current = true;
    const t = setTimeout(() => {
      editor.commands.setContent(initialContent, { contentType: "markdown" });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Live markdown out. createEditor's onUpdate takes no arguments, so read
  // via the native Tiptap event emitter instead, closing over `editor`.
  useEffect(() => {
    if (!editor) return;
    const handler = () => onChange?.(editor.getMarkdown());
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, onChange]);

  // Cmd/Ctrl+S to save — Edra's toolbar has no app-specific save slot.
  useEffect(() => {
    if (!editor) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.(editor.getMarkdown());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editor, onSave]);

  if (!editor) return null;

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
      aria-busy={saving}
    >
      <Edra editor={editor}>
        <Edra.Toolbar className="border-b border-[var(--border)]" />
        <Edra.Content className="min-h-[400px] px-4 py-3" />
        <Edra.BubbleMenu />
      </Edra>
    </div>
  );
}
