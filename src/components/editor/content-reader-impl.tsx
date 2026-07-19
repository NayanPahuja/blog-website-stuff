"use client";

import "edra-react/styles/editor.css";
import "edra-react/styles/onedark.css";

import { Component, useEffect, useRef, type ReactNode } from "react";
import { createEditor, Edra } from "edra-react";
// Type-only import — activates @tiptap/markdown's ambient augmentation of
// `SetContentOptions` (the `contentType` option), same reason as the editor.
import type {} from "@tiptap/markdown";

/**
 * Renders stored markdown through edra-react's own node views (read-only)
 * instead of react-markdown, so custom node types it introduces — mermaid
 * diagrams, callouts, math — render identically to how they looked while
 * writing. react-markdown has no idea these syntaxes exist.
 *
 * A crash in any one node view (edra-react's custom nodes are less battle
 * tested than react-markdown's plain renderer) shouldn't take the whole
 * page down, so this is wrapped in an error boundary by the exported
 * component below.
 */
function ContentReaderInner({ content }: { content: string }) {
  const editor = createEditor();

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!editor || loadedRef.current) return;
    loadedRef.current = true;
    editor.setEditable(false);
    const t = setTimeout(() => {
      editor.commands.setContent(content, { contentType: "markdown" });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <Edra editor={editor}>
      <Edra.Content className="cursor-default" />
    </Edra>
  );
}

class ReaderErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error("[ContentReader] failed to render:", err);
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-[var(--muted)]">This content couldn&apos;t be rendered.</p>;
    }
    return this.props.children;
  }
}

export function ContentReader({ content }: { content: string }) {
  return (
    <ReaderErrorBoundary>
      <ContentReaderInner content={content} />
    </ReaderErrorBoundary>
  );
}
