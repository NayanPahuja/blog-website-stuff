"use client";

import dynamic from "next/dynamic";

/**
 * edra-react pulls in katex/mermaid/radix popovers that touch the DOM at
 * module scope — must load client-only, never during SSR.
 */
export const MarkdownEditor = dynamic(
  () => import("./markdown-editor-impl").then((m) => m.MarkdownEditor),
  { ssr: false },
);
