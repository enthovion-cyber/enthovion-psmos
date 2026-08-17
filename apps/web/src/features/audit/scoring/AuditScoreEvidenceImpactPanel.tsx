import { AuditCard } from "../shared/AuditUi";
export function AuditScoreEvidenceImpactPanel({ impact = {} }: { impact?: Record<string, any> }) { return <AuditCard title="Evidence Impact"><Grid data={impact} /></AuditCard>; }
function Grid({ data }: { data: Record<string, any> }) { return <div className="grid gap-3 sm:grid-cols-4">{Object.entries(data ?? {}).map(([k, v]) => <div key={k} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{k}</p><b>{String(v ?? "-")}</b></div>)}</div>; }
