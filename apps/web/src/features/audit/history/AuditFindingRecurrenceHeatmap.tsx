import { AuditEmptyState } from '../shared/AuditUi';

export function AuditFindingRecurrenceHeatmap({ rows }: { rows?: Array<Record<string, unknown>> }) {
  const data = rows ?? [];
  if (!data.length) return <AuditEmptyState title="No recurrence heatmap" message="Run repeat finding analysis or add confirmed repeated findings to populate the heatmap." />;
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{data.map((row, index) => <div key={String(row.key ?? index)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{String(row.module ?? 'Audit')}</div><div className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{String(row.count ?? 0)}</div><p className="text-xs text-[var(--psm-muted)]">Site {String(row.siteId ?? 'Company')} | Unit {String(row.unitId ?? 'All')}</p></div>)}</div>;
}
