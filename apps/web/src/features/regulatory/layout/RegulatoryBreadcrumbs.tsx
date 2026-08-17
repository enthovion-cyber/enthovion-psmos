import Link from 'next/link';

export function RegulatoryBreadcrumbs({ current }: { current?: string | undefined }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--psm-muted)]">
      <Link href="/regulatory" className="hover:text-primary">Regulatory Register</Link>
      {current ? <span>/</span> : null}
      {current ? <span className="text-[var(--psm-fg)]">{current}</span> : null}
    </div>
  );
}
