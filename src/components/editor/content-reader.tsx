"use client";

import dynamic from "next/dynamic";

/**
 * Same reasoning as markdown-editor.tsx: mermaid/katex touch the DOM at
 * module scope, must load client-only. Note this means stored markdown is
 * NOT present in the server-rendered HTML — see the public page call sites
 * for the SEO/no-JS trade-off this implies.
 */
export const ContentReader = dynamic(
  () => import("./content-reader-impl").then((m) => m.ContentReader),
  { ssr: false },
);
