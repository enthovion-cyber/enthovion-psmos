import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';

export function ComplianceEvidenceReadinessTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const rows = detail?.evidenceReadiness?.rows ?? [];
  return <RegulatoryCard title="Evidence Readiness Foundation">{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap justify-between gap-3"><b>{row.evidence_type ?? 'Evidence'}</b><RegulatoryEvidenceReadinessBadge status={row.readiness_status} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.evidence_description ?? row.missing_reason ?? 'No evidence description returned.'}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No evidence readiness rows returned by backend.</p>}</RegulatoryCard>;
}
