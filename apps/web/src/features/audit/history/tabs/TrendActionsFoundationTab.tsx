import { AuditEmptyState } from '../../shared/AuditUi';

export function TrendActionsFoundationTab({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return <AuditEmptyState title="No action foundation candidates" message="Trend results only produce action foundations when recommendations have source support." />;
  return <div className="grid gap-3 md:grid-cols-2">{rows.map((row, index) => <div key={String(row.resultId ?? index)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">{String(row.title ?? 'Action foundation')}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.recommendedActionFoundation ?? 'No recommendation')}</p><p className="mt-3 text-xs font-semibold text-[var(--psm-muted)]">Action Engine: {String(row.actionEngineStatus ?? 'Foundation only')}</p></div>)}</div>;
}
