import Link from "next/link";

type Tag = { slug: string; name: string };

export function ContentListItem({
  href,
  date,
  dateFallback,
  meta,
  title,
  excerpt,
  tags,
}: {
  href: string;
  date: Date | null;
  dateFallback?: string;
  meta?: string[];
  title: string;
  excerpt?: string | null;
  tags?: Tag[];
}) {
  return (
    <article className="post">
      <div className="post-meta-line">
        <time className="date" dateTime={date?.toISOString() ?? ""}>
          {date
            ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : (dateFallback ?? "")}
        </time>
        {meta?.map((item) => (
          <span key={item} className="post-cat">
            {item}
          </span>
        ))}
      </div>
      <Link href={href}>{title}</Link>
      {excerpt && (
        <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{excerpt}</p>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="inline-block rounded px-2 py-0.5 text-xs font-medium text-[var(--faint)] hover:text-[var(--link)] transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
