export const sampleContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { textAlign: "left", level: 1 },
      content: [{ type: "text", text: "Welcome to Edra React 🚀" }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "left" },
      content: [
        { type: "text", text: "Edra is a modern, extensible rich text editor built on top of " },
        {
          type: "text",
          marks: [{ type: "link", attrs: { href: "https://tiptap.dev", target: "_blank" } }],
          text: "Tiptap",
        },
        { type: "text", text: " specifically for " },
        { type: "text", marks: [{ type: "bold" }], text: "React" },
        { type: "text", text: ". It leverages shadcn/ui for a beautiful, cohesive writing experience." },
      ],
    },
    {
      type: "callout",
      attrs: { emoji: "💡" },
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "left" },
          content: [
            { type: "text", text: "Tip: Type " },
            { type: "text", marks: [{ type: "code" }], text: "/" },
            { type: "text", text: " to open the Slash Command menu!" },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { textAlign: "left", level: 2 },
      content: [{ type: "text", text: "Powerful Features" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Slash commands for quick formatting" }] }],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Bubble menus for inline formatting" }] }],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Advanced media uploads & Iframe embedding" }] }],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { textAlign: "left", level: 2 },
      content: [{ type: "text", text: "Syntax Highlighted Code Blocks" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [
        {
          type: "text",
          text: "function fibonacci(n: number): number {\n  if (n <= 1) return n\n  return fibonacci(n - 1) + fibonacci(n - 2)\n}",
        },
      ],
    },
    {
      type: "heading",
      attrs: { textAlign: "left", level: 2 },
      content: [{ type: "text", text: "Tables" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Feature" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Description" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Toolbar" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Full-featured formatting toolbar" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Bubble Menu" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Context-aware inline formatting" }] }] },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { textAlign: "left", level: 2 },
      content: [{ type: "text", text: "Math & Media" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Edra supports KaTeX math equations and media placeholders:" },
      ],
    },
    {
      type: "mediaPlaceholder",
      attrs: { mediaType: "image" },
    },
  ],
}
