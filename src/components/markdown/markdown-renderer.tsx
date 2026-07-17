import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";

/**
 * Single source of truth for rendering markdown across public pages
 * (blog detail, thought detail). Fixes the previous issue where each page
 * had its own duplicated ReactMarkdown config with no syntax highlighting.
 *
 * Uses react-markdown with remark-gfm for GitHub Flavored Markdown support.
 * Code blocks are styled but not syntax-highlighted to avoid async issues.
 */

type Components = ComponentProps<typeof ReactMarkdown>["components"];

const components: Components = {
  h1: ({ children }) => (
    <h2 className="text-2xl font-bold mt-8 mb-4 text-[var(--text)]">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="text-xl font-semibold mt-6 mb-3 text-[var(--text)]">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-lg font-semibold mt-5 mb-2 text-[var(--text)]">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="text-base font-semibold mt-4 mb-2 text-[var(--text)]">
      {children}
    </h5>
  ),
  h5: ({ children }) => (
    <h6 className="text-sm font-semibold mt-4 mb-2 text-[var(--text)]">
      {children}
    </h6>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-semibold mt-4 mb-2 text-[var(--muted)]">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[var(--text)] leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 text-[var(--text)] space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 text-[var(--text)] space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-[var(--text)]">{children}</li>,
  // Inline code only — block code is wrapped in <pre><code> (see below).
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-[var(--code-bg)] text-[var(--text)] px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="prose-pre bg-[var(--code-bg)] text-[var(--text)] p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--link)] hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--border)] pl-4 italic text-[var(--muted)] my-4">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-[var(--border)]">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border)] bg-[var(--code-bg)] px-3 py-2 text-left text-sm font-semibold text-[var(--text)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]">
      {children}
    </td>
  ),
  hr: () => <hr className="my-8 border-[var(--border)]" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      className="rounded-lg max-w-full my-4"
    />
  ),
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
