import Link from 'next/link';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { RegulatoryComplianceAssessmentStatusBadge } from '../shared/RegulatoryComplianceAssessmentStatusBadge';
import { RegulatoryComplianceGapStatusBadge } from '../shared/RegulatoryComplianceGapStatusBadge';
import { RegulatoryComplianceStaleBadge } from '../shared/RegulatoryComplianceStaleBadge';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import type { RegulatoryComplianceAssessment } from '../types/regulatory-compliance.types';

export function RegulatoryComplianceAssessmentTable({ rows }: { rows?: RegulatoryComplianceAssessment[] | undefined }) {
  if (!rows?.length) return <p className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No compliance assessments match the selected scope or filters.</p>;
  return (
    <div className="hidden overflow-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr>{['Assessment', 'Source', 'Scope', 'Compliance', 'Gap', 'Evidence', 'Owner', 'Assessor', 'Reviewer', 'Review', 'Stale', 'Updated', 'Actions'].map((column) => <th key={column} className="px-3 py-3">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]">
          <td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/regulatory/compliance-status/assessments/${row.id}`}>{row.assessment_number ?? 'Assessment'}</Link><div className="text-xs text-[var(--psm-muted)]">{row.assessment_title}</div></td>
          <td className="px-3 py-3">{row.source_label ?? row.source_title ?? row.source_record_id ?? 'Unlinked'}</td>
          <td className="px-3 py-3">{[row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company'}</td>
          <td className="px-3 py-3"><RegulatoryComplianceStatusBadge status={row.compliance_status} /></td>
          <td className="px-3 py-3"><RegulatoryComplianceGapStatusBadge status={row.gap_status} /></td>
          <td className="px-3 py-3"><RegulatoryEvidenceReadinessBadge status={row.evidence_readiness_status} /></td>
          <td className="px-3 py-3">{row.owner_label ?? 'Unassigned'}</td>
          <td className="px-3 py-3">{row.assessor_label ?? 'Unassigned'}</td>
          <td className="px-3 py-3">{row.reviewer_label ?? 'Unassigned'}</td>
          <td className="px-3 py-3"><RegulatoryComplianceAssessmentStatusBadge status={row.assessment_status} /></td>
          <td className="px-3 py-3"><RegulatoryComplianceStaleBadge status={row.stale_status} /></td>
          <td className="px-3 py-3">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Not updated'}</td>
          <td className="px-3 py-3"><Link className="text-primary" href={`/regulatory/compliance-status/assessments/${row.id}`}>Open</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
