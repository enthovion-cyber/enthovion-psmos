import { AuditCard } from "../shared/AuditUi";
export function AuditMappingHealthPanel({ rows }: { rows: Record<string, any>[] }) {
  const health = rows.reduce((acc: Record<string, number>, row) => ({ ...acc, [row.mapping_health_status ?? "Unknown"]: (acc[row.mapping_health_status ?? "Unknown"] ?? 0) + 1 }), {});
  const entries = Object.entries(health) as Array<[string, number]>;
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return <AuditCard title="Mapping health breakdown">{entries.length ? <div className="space-y-3">{entries.map(([key, count]) => <div key={key}><div className="mb-1 flex justify-between text-sm"><span>{key}</span><b>{count}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(5, count / max * 100)}%` }} /></div></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No health records are available yet.</p>}</AuditCard>;
}
