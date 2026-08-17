'use client';

export function TechnicalDataCompletenessCard({ completeness }: { completeness?: Record<string, unknown> | undefined }) {
  const missing = Array.isArray(completeness?.missing) ? completeness.missing as string[] : [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--psm-text)]">Technical Data Completeness</h3>
          <p className="text-sm text-[var(--psm-muted)]">Backend-generated completeness and missing data check.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${missing.length ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{String(completeness?.status ?? 'Not checked')}</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--psm-surface-2)]">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(Number(completeness?.score ?? 0), 100)}%` }} />
      </div>
      {missing.length ? <div className="mt-4 flex flex-wrap gap-2">{missing.map((item) => <span key={item} className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">{item}</span>)}</div> : <p className="mt-4 text-sm text-success">All required technical fields are complete.</p>}
    </section>
  );
}
