import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingStatusStrip } from '../AuditMappingUi';

export function AuditMappingCoverageSection({ mapping }: { mapping?: Record<string, any> }) {
  const checks = mapping?.coverage_trace_json?.checks ?? mapping?.coverage_trace_json?.blockers ?? [];
  return <RegulatoryCard title="Coverage / Readiness" subtitle="Backend-generated coverage, readiness blockers, missing evidence, checklist, finding, CAPA, and scoring state."><AuditMappingStatusStrip row={mapping as any} />{checks?.length ? <ul className="mt-4 space-y-2 text-sm text-[var(--psm-muted)]">{checks.map((item: any, index: number) => <li key={index} className="rounded-lg bg-[var(--psm-surface-2)] px-3 py-2">{item.title ?? item.label ?? JSON.stringify(item)}</li>)}</ul> : <p className="mt-4 text-sm text-[var(--psm-muted)]">No backend blockers returned.</p>}</RegulatoryCard>;
}
