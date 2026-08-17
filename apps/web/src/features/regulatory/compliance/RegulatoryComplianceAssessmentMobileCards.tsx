import Link from 'next/link';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import type { RegulatoryComplianceAssessment } from '../types/regulatory-compliance.types';

export function RegulatoryComplianceAssessmentMobileCards({ rows }: { rows?: RegulatoryComplianceAssessment[] | undefined }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows?.map((row) => <Link key={row.id} href={`/regulatory/compliance-status/assessments/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
        <div className="font-semibold text-primary">{row.assessment_number ?? 'Assessment'}</div>
        <div className="mt-1 text-sm text-[var(--psm-fg)]">{row.assessment_title ?? row.source_label}</div>
        <div className="mt-3 flex flex-wrap gap-2"><RegulatoryComplianceStatusBadge status={row.compliance_status} /><RegulatoryEvidenceReadinessBadge status={row.evidence_readiness_status} /></div>
        <div className="mt-3 text-xs text-[var(--psm-muted)]">Owner: {row.owner_label ?? 'Unassigned'} · Gaps: {row.gap_count ?? 0}</div>
      </Link>)}
    </div>
  );
}
