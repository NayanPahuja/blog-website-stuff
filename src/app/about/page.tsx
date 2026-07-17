import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — pkg/nayan",
};

export default function AboutPage() {
  return (
    <div className="py-8 space-y-6">
      <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
        About
      </h1>
      <div className="prose prose-sm max-w-none text-[var(--text)] space-y-4">
        <p className="text-[var(--muted)]">
          A personal knowledge garden &mdash; a space for technical writing, project notes, and explorations.
        </p>
      </div>
    </div>
  );
}
