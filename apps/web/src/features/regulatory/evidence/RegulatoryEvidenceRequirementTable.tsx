import Link from 'next/link';
import { RegulatoryCard, RegulatoryEmptyState } from '../shared/RegulatoryUi';
import { RegulatoryEvidenceTypeBadge } from '../shared/RegulatoryEvidenceTypeBadge';
import type { RegulatoryEvidenceRequirement } from '../types/regulatory-evidence.types';

export function RegulatoryEvidenceRequirementTable({ rows }: { rows?: RegulatoryEvidenceRequirement[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No evidence requirements" message="No required evidence definitions exist for this scope yet." />;
  return (
    <RegulatoryCard title="Required Evidence Register" subtitle="Backend-controlled evidence requirements with source, owner, reviewer, frequency, due date, retention, and confidentiality foundation.">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Requirement</th><th className="px-3 py-2">Expected Evidence</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Owner / Reviewer</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}>
            <td className="px-3 py-3"><Link href={`/regulatory/evidence/requirements/${row.id}`} className="font-semibold text-primary hover:underline">{row.requirement_code ?? row.id}</Link><div className="text-[var(--psm-muted)]">{row.requirement_title}</div></td>
            <td className="px-3 py-3"><RegulatoryEvidenceTypeBadge type={row.evidence_type_expected} /><div className="mt-1 text-xs text-[var(--psm-muted)]">{row.required_document_type ?? row.required_record_type ?? row.evidence_description ?? 'No requirement basis supplied'}</div></td>
            <td className="px-3 py-3 text-[var(--psm-muted)]">{row.source_type}<div>{row.regulatory_item_id ?? row.obligation_id ?? row.compliance_assessment_id ?? 'Manual'}</div></td>
            <td className="px-3 py-3 text-[var(--psm-muted)]">{row.evidence_owner_user_id ?? 'No owner'}<div>{row.reviewer_user_id ?? 'No reviewer'}</div></td>
            <td className="px-3 py-3 text-[var(--psm-muted)]">{row.due_date ? new Date(row.due_date).toLocaleDateString() : 'Not set'}</td>
            <td className="px-3 py-3">{row.requirement_status ?? 'Draft'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </RegulatoryCard>
  );
}
