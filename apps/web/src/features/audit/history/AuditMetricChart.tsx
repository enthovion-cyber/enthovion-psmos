import { AuditEmptyState } from '../shared/AuditUi';

export function AuditTrendMetricChart({ title, rows, labelKey = 'period', valueKey = 'count' }: { title: string; rows?: Array<Record<string, unknown>>; labelKey?: string; valueKey?: string }) {
  const data = rows ?? [];
  const max = Math.max(1, ...data.map((row) => Number(row[valueKey] ?? 0)));
  if (!data.length) return <AuditEmptyState title={`No ${title.toLowerCase()} data`} message="No real backend records match the current scope and filters." />;
  return <div className="space-y-3">{data.map((row, index) => <div key={`${String(row[labelKey])}-${index}`}><div className="mb-1 flex justify-between text-xs text-[var(--psm-muted)]"><span>{String(row[labelKey] ?? 'Unassigned')}</span><span>{Number(row[valueKey] ?? 0)}</span></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, (Number(row[valueKey] ?? 0) / max) * 100)}%` }} /></div></div>)}</div>;
}
