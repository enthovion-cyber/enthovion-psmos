'use client';

export function ReportCategoryCards({ categories = [] }: { categories?: Array<{ category: string; reports: string[] }> | undefined }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {categories.length ? categories.map((item) => (
        <article key={item.category} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <p className="text-sm font-semibold">{item.category}</p>
          <p className="mt-2 text-2xl font-semibold">{item.reports.length}</p>
          <p className="text-xs text-[var(--psm-muted)]">Configured report types</p>
        </article>
      )) : (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No report categories are configured for this tenant/site.</div>
      )}
    </section>
  );
}
