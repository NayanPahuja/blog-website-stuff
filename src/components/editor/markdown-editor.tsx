"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import { CodeBlockLowlight as CodeBlockLowlightExtension } from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { common, createLowlight } from "lowlight";

// Shared lowlight instance with all common languages registered.
const lowlight = createLowlight(common);

/**
 * Tiptap-based markdown editor for the admin (thoughts + blogs).
 *
 * Why Tiptap over the previous Lexical editor: native, reliable code-block
 * support via the `CodeBlockLowlight` extension — Lexical's default markdown
 * transformers do not serialize fenced code blocks at all, which corrupted
 * stored markdown. Markdown <-> HTML round-tripping is handled by
 * `tiptap-markdown`, which correctly emits ``` ```lang ``` fenced blocks and
 * reads them back in.
 *
 * The editor is markdown-first: content is stored and emitted as markdown,
 * matching how `content_md` is persisted and rendered publicly by
 * <MarkdownRenderer/>.
 */
export function MarkdownEditor({
  initialContent = "",
  onChange,
  onSave,
  placeholder = "Start writing...",
  saving,
}: {
  initialContent?: string;
  onChange?: (md: string) => void;
  onSave?: (md: string) => void;
  placeholder?: string;
  saving: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false, // replaced by CodeBlockLowlight below
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      PlaceholderExtension.configure({ placeholder }),
      CodeBlockLowlightExtension.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      // Two-way markdown serialization. `breaks: false` keeps paragraphs as
      // blank-line-separated blocks (standard markdown); `linkify: true`
      // auto-links bare URLs.
      Markdown.configure({
        html: false,
        breaks: false,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    // `content` accepts markdown directly thanks to tiptap-markdown.
    content: initialContent || "",
    onUpdate: ({ editor: ed }) => {
      // tiptap-markdown adds getMarkdown() to the editor's storage.
      onChange?.(ed.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-[var(--text)] [&_.ProseMirror-placeholder]:text-[var(--faint)]",
      },
    },
  });

  // Cmd/Ctrl+S to save.
  useEffect(() => {
    if (!editor) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.(editor.storage.markdown.getMarkdown());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editor, onSave]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
      <Toolbar editor={editor} onSave={onSave} saving={saving} />
      <EditorContent editor={editor} />
    </div>
  );
}

function serializeMarkdown(editor: Editor) {
  return editor.storage.markdown.getMarkdown();
}

function Toolbar({
  editor,
  onSave,
  saving,
}: {
  editor: Editor;
  onSave?: (md: string) => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--code-bg)] px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        label="Inline code"
      >
        {"</>"}
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        label="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
      >
        H3
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet list"
      >
        &bull;
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Ordered list"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Blockquote"
      >
        &ldquo;
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        label="Horizontal rule"
      >
        ─
      </ToolbarButton>

      <Separator />

      {/* Code block — fenced code with language + highlighting. */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="Code block"
      >
        {"{ }"}
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt("Link URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
        label="Link"
      >
        &#128279;
      </ToolbarButton>

      <div className="ml-auto">
        <button
          type="button"
          onClick={() => onSave?.(serializeMarkdown(editor))}
          disabled={saving}
          className="rounded-md px-3 py-1 text-xs font-medium bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded px-1.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--surface-2)] text-[var(--text)]"
          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span className="w-px h-5 bg-[var(--border)] mx-1" />;
}
