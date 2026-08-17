'use client';

export function CommonReportsGrid({ reports = [], onGenerate }: { reports?: string[] | undefined; onGenerate?: ((reportType: string) => void) | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Common MI Reports</h2>
        <span className="text-xs text-[var(--psm-muted)]">Backend templates and allowed data sources only</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.length ? reports.map((report) => (
          <article key={report} className="rounded-xl border border-[var(--psm-line)] p-4">
            <p className="font-semibold">{report}</p>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">Includes permission-filtered MI source data, audit context, and export history.</p>
            <button type="button" onClick={() => onGenerate?.(report)} className="mt-4 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Generate</button>
          </article>
        )) : <p className="text-sm text-[var(--psm-muted)]">No common reports available.</p>}
      </div>
    </section>
  );
}
