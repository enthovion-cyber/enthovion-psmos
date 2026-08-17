import { AuditEmptyState } from '../../shared/AuditUi';

export function TrendHistoryTab({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return <AuditEmptyState title="No trend history events" message="Trend mutations will write immutable audit trend history events here." />;
  return <div className="space-y-3">{rows.map((row) => <div key={String(row.id)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold">{String(row.event_title ?? row.event_type ?? 'Trend event')}</h3><p className="text-sm text-[var(--psm-muted)]">{String(row.event_description ?? '')}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">{row.created_at ? new Date(String(row.created_at)).toLocaleString() : '-'}</p></div>)}</div>;
}
