import { RegulatoryApplicabilityStatusBadge } from '../shared/RegulatoryApplicabilityStatusBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';

export function RegulatoryApplicabilityMatrixTable({ rows }: { rows?: Array<Record<string, any>> | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No matrix rows" message="The matrix is generated from real register items and assessment records." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[1200px] w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr><th className="p-3">Requirement</th><th className="p-3">Jurisdiction</th><th className="p-3">Category</th><th className="p-3">Criticality</th><th className="p-3">Site</th><th className="p-3">Unit</th><th className="p-3">Area</th><th className="p-3">Equipment</th><th className="p-3">Process/Chemical/Activity</th><th className="p-3">Applicability</th><th className="p-3">Rationale</th><th className="p-3">Next Review</th></tr></thead><tbody>
        {rows.map((row, index) => <tr key={`${row.regulatoryItem?.id ?? index}`} className="border-t border-[var(--psm-line)]"><td className="p-3"><div className="font-semibold">{row.regulatoryItem?.requirement_code ?? '-'}</div><div className="text-xs text-[var(--psm-muted)]">{row.regulatoryItem?.requirement_title ?? '-'}</div></td><td className="p-3">{row.jurisdiction?.jurisdiction_name ?? row.regulatoryItem?.jurisdiction_level ?? '-'}</td><td className="p-3">{row.regulatoryItem?.category ?? '-'}</td><td className="p-3">{row.regulatoryItem?.criticality ?? '-'}</td><td className="p-3">{row.site_id ?? '-'}</td><td className="p-3">{row.unit_id ?? '-'}</td><td className="p-3">{row.area_id ?? '-'}</td><td className="p-3">{row.equipment_id ?? '-'}</td><td className="p-3">{[row.process_system, row.chemical_substance, row.activity_operation].filter(Boolean).join(' / ') || '-'}</td><td className="p-3"><RegulatoryApplicabilityStatusBadge status={row.applicability_status} /></td><td className="p-3 max-w-xs truncate">{row.rationale ?? '-'}</td><td className="p-3">{row.next_review_date ? new Date(row.next_review_date).toLocaleDateString() : '-'}</td></tr>)}
      </tbody></table>
    </div>
  );
}
