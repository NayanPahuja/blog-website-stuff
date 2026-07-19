"use client";

import "edra-react/styles/editor.css";
import "edra-react/styles/onedark.css";

import { useEffect, useRef, useState } from "react";
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

/**
 * edra-react's Callout node (and possibly other custom nodes with a
 * `renderMarkdown`/`markdownTokenizer` pair) can blow the stack inside
 * @tiptap/markdown's serializer for some content shapes — a package-level
 * bug, not something wiring can fix. Never let a serialization crash take
 * the whole editor down; surface it once and skip that update.
 */
function safeGetMarkdown(editor: NonNullable<ReturnType<typeof createEditor>>): string | null {
  try {
    return editor.getMarkdown();
  } catch (err) {
    console.error("[MarkdownEditor] getMarkdown() failed — content not saved:", err);
    return null;
  }
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
    const handler = () => {
      const md = safeGetMarkdown(editor);
      if (md !== null) onChange?.(md);
    };
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
        const md = safeGetMarkdown(editor);
        if (md !== null) onSave?.(md);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editor, onSave]);

  const [fullscreen, setFullscreen] = useState(false);

  // Escape exits fullscreen; block body scroll behind the overlay while active.
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  if (!editor) return null;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-[var(--bg)]"
          : "rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
      }
      aria-busy={saving}
    >
      <Edra editor={editor}>
        <div className="flex items-center border-b border-[var(--border)]">
          <Edra.Toolbar className="flex-1 min-w-0" />
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md mr-1 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
          >
            {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>
        <Edra.Content
          className={fullscreen ? "flex-1 min-h-0 overflow-y-auto px-4 py-3" : "min-h-[400px] px-4 py-3"}
        />
        <Edra.BubbleMenu />
      </Edra>
    </div>
  );
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" />
    </svg>
  );
}
