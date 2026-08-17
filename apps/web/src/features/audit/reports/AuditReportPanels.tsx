import { AuditCard, AuditEmptyState } from "../shared/AuditUi";
export function RowsPanel({ title, rows, empty }: { title: string; rows: Record<string, unknown>[]; empty: string }) {
  return <AuditCard title={title}>{rows.length ? <div className="space-y-2">{rows.map((row, index) => <pre key={String(row.id ?? index)} className="max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(row, null, 2)}</pre>)}</div> : <AuditEmptyState title={title} message={empty} />}</AuditCard>;
}
export function JsonPanel({ title, data }: { title: string; data: unknown }) {
  return <AuditCard title={title}><pre className="max-h-[680px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(data ?? {}, null, 2)}</pre></AuditCard>;
}
