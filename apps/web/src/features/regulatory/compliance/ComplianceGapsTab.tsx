import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryComplianceGapSeverityBadge } from '../shared/RegulatoryComplianceGapSeverityBadge';
import { RegulatoryComplianceGapStatusBadge } from '../shared/RegulatoryComplianceGapStatusBadge';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';
import { RegulatoryComplianceGapDetailPanel } from './RegulatoryComplianceGapDetailPanel';

export function ComplianceGapsTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const rows = detail?.gaps?.rows ?? [];
  return <div className="space-y-5"><RegulatoryCard title="Compliance Gaps">{rows.length ? <div className="space-y-2">{rows.map((gap) => <div key={gap.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap justify-between gap-3"><b>{gap.gap_number} - {gap.gap_title}</b><span className="flex gap-2"><RegulatoryComplianceGapSeverityBadge severity={gap.severity} /><RegulatoryComplianceGapStatusBadge status={gap.gap_status} /></span></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{gap.gap_description ?? gap.recommended_fix ?? 'No gap description returned.'}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No compliance gaps returned for this assessment.</p>}</RegulatoryCard>{rows[0] ? <RegulatoryComplianceGapDetailPanel gap={rows[0]} /> : null}</div>;
}
