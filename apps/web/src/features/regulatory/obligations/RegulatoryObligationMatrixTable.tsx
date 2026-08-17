import type { RegulatoryObligationRegister } from '../types/regulatory-obligation.types';
import { RegulatoryButton } from '../shared/RegulatoryUi';
import { RegulatoryCriticalityBadge } from '../shared/RegulatoryCriticalityBadge';
import { RegulatoryObligationApplicabilityBadge, RegulatoryObligationEvidenceBadge, RegulatoryObligationMappingBadge, RegulatoryObligationStaleBadge } from '../shared/RegulatoryObligationBadges';

export function RegulatoryObligationMatrixTable({ data }: { data?: (RegulatoryObligationRegister & { view?: string | undefined; columns?: string[] | undefined }) | undefined }) {
  const rows = data?.rows ?? [];
  if (!rows.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No matrix rows match this company/site scope.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr>{['Parent Requirement', 'Obligation', 'Scope', 'Category', 'PSM Element', 'Module', 'Applicability', 'Compliance', 'Criticality', 'Owner', 'Frequency', 'Due Date', 'Evidence Expected', 'Module Mapping', 'Stale', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="max-w-xs px-3 py-3 text-[var(--psm-muted)]">{row.parent_requirement_label ?? row.regulatory_item_id}</td>
              <td className="max-w-xs px-3 py-3 font-semibold text-[var(--psm-fg)]">{row.obligation_code} - {row.obligation_title}</td>
              <td className="px-3 py-3">{[row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company-wide'}</td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">{row.related_psm_element ?? 'Not mapped'}</td>
              <td className="px-3 py-3">{row.related_module ?? 'Not mapped'}</td>
              <td className="px-3 py-3"><RegulatoryObligationApplicabilityBadge value={row.applicability_status} /></td>
              <td className="px-3 py-3">{row.compliance_status}</td>
              <td className="px-3 py-3"><RegulatoryCriticalityBadge criticality={row.criticality} /></td>
              <td className="px-3 py-3">{row.owner?.displayName ?? row.owner_label}</td>
              <td className="px-3 py-3">{row.frequency ?? row.trigger_event ?? 'Missing'}</td>
              <td className="px-3 py-3">{row.next_due_date ?? row.due_date ? new Date(String(row.next_due_date ?? row.due_date)).toLocaleDateString() : 'Not Set'}</td>
              <td className="px-3 py-3"><RegulatoryObligationEvidenceBadge value={row.evidence_expectation_status} /></td>
              <td className="px-3 py-3"><RegulatoryObligationMappingBadge value={row.module_mapping_status} /></td>
              <td className="px-3 py-3"><RegulatoryObligationStaleBadge value={row.stale_status} reason={row.stale_reason} /></td>
              <td className="px-3 py-3"><RegulatoryButton href={`/regulatory/obligations/${row.id}`} variant="secondary">Drill In</RegulatoryButton></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
