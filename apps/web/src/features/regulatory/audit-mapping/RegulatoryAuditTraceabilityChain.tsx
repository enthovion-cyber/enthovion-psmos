import { RegulatoryCard } from '../shared/RegulatoryUi';
import { valueText } from './AuditMappingUi';

export function RegulatoryAuditTraceabilityChain({ rows }: { rows?: Record<string, any>[] | undefined }) {
  const latest = rows?.[0]?.traceability_json ?? rows?.[0];
  return <RegulatoryCard title="Latest Traceability Chain">{latest ? <div className="grid gap-3 md:grid-cols-4">{['source', 'auditTarget', 'coverage', 'readiness'].map((key) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{key}</p><p className="mt-2 text-sm text-[var(--psm-fg)]">{valueText(latest?.[key] ?? latest?.[`${key}_json`])}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend traceability snapshot exists for this scope.</p>}</RegulatoryCard>;
}
