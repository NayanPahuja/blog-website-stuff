import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — pkg/nayan",
};

export default function PortfolioPage() {
  return (
    <div className="py-8 space-y-6">
      <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
        Portfolio
      </h1>
      <p className="text-[var(--muted)]">Coming soon.</p>
    </div>
  );
}
