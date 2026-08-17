'use client';

export function ReportPreviewPanel({ summary = {} }: { summary?: Record<string, number> | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Report Preview / Readiness</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(summary).length ? Object.entries(summary).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-[var(--psm-line)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        )) : <p className="text-sm text-[var(--psm-muted)]">No report preview data available yet.</p>}
      </div>
    </section>
  );
}
