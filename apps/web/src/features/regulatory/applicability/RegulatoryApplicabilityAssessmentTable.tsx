import Link from 'next/link';
import { RegulatoryApplicabilityAssessmentStatusBadge } from '../shared/RegulatoryApplicabilityAssessmentStatusBadge';
import { RegulatoryApplicabilityStatusBadge } from '../shared/RegulatoryApplicabilityStatusBadge';
import { RegulatoryApplicabilityStaleBadge } from '../shared/RegulatoryApplicabilityStaleBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';

export function RegulatoryApplicabilityAssessmentTable({ rows }: { rows?: Array<Record<string, any>> | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No applicability assessments" message="No fake applicability decisions are shown. Create an assessment or use item-level decision workflow." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[1060px] w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr><th className="p-3">Assessment</th><th className="p-3">Requirement</th><th className="p-3">Jurisdiction</th><th className="p-3">Decision</th><th className="p-3">Assessment Status</th><th className="p-3">Rationale</th><th className="p-3">Last Assessed</th><th className="p-3">Next Review</th><th className="p-3">Stale</th><th className="p-3">Actions</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3"><div className="font-semibold">{row.assessment_number ?? row.id}</div><div className="text-xs text-[var(--psm-muted)]">{row.assessment_title}</div></td><td className="p-3">{row.item?.requirement_code ?? row.regulatory_item_id ?? '-'}</td><td className="p-3">{row.jurisdiction?.jurisdiction_name ?? row.jurisdiction_id ?? '-'}</td><td className="p-3"><RegulatoryApplicabilityStatusBadge status={row.applicability_status} /></td><td className="p-3"><RegulatoryApplicabilityAssessmentStatusBadge status={row.assessment_status} /></td><td className="p-3 max-w-xs truncate">{row.rationale ?? '-'}</td><td className="p-3">{row.last_assessed_at ? new Date(row.last_assessed_at).toLocaleDateString() : '-'}</td><td className="p-3">{row.next_review_date ? new Date(row.next_review_date).toLocaleDateString() : '-'}</td><td className="p-3"><RegulatoryApplicabilityStaleBadge stale={row.stale} /></td><td className="p-3"><Link className="font-semibold text-primary" href={`/regulatory/applicability/assessments/${row.id}`}>View</Link></td></tr>)}
      </tbody></table>
    </div>
  );
}
