'use client';

export function ExportTypeCards({ types = [], summary = {} }: { types?: string[] | undefined; summary?: Record<string, number> | undefined }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {types.length ? types.map((type) => (
        <article key={type} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <p className="text-sm font-semibold">{type}</p>
          <p className="mt-2 text-2xl font-semibold">{summary[type] ?? 0}</p>
          <p className="text-xs text-[var(--psm-muted)]">Export jobs / packages</p>
        </article>
      )) : <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No export types configured.</div>}
    </section>
  );
}
