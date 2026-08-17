import Link from 'next/link';
import type { RegulatoryObligationRegister } from '../types/regulatory-obligation.types';
import { RegulatoryButton } from '../shared/RegulatoryUi';
import { RegulatoryCriticalityBadge } from '../shared/RegulatoryCriticalityBadge';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { RegulatoryObligationApplicabilityBadge, RegulatoryObligationEvidenceBadge, RegulatoryObligationMappingBadge, RegulatoryObligationStaleBadge, RegulatoryObligationStatusBadge } from '../shared/RegulatoryObligationBadges';
import { RegulatoryObligationMobileCards } from './RegulatoryObligationMobileCards';

export function RegulatoryObligationTable({ register, setFilters }: { register?: RegulatoryObligationRegister | undefined; setFilters: (fn: (filters: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const rows = register?.rows ?? [];
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
            <tr>{['Obligation Code', 'Obligation Title', 'Parent Requirement', 'Category', 'PSM Element', 'Module', 'Scope', 'Applicability', 'Compliance', 'Status', 'Criticality', 'Frequency', 'Due Date', 'Owner', 'Evidence', 'Mapping', 'Stale', 'Updated', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-3 py-3 font-semibold text-primary">{row.obligation_code ?? 'No Code'}</td>
                <td className="max-w-[260px] px-3 py-3"><Link href={`/regulatory/obligations/${row.id}`} className="font-semibold text-[var(--psm-fg)] hover:text-primary">{row.obligation_title ?? 'Untitled obligation'}</Link><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.obligation_reference ?? row.short_summary ?? 'No reference entered'}</p></td>
                <td className="max-w-[220px] px-3 py-3 text-[var(--psm-muted)]">{row.parent_requirement_label ?? row.regulatory_item_id ?? 'Missing parent'}</td>
                <td className="px-3 py-3">{row.category ?? 'Not Set'}</td>
                <td className="px-3 py-3">{row.related_psm_element ?? 'Not mapped'}</td>
                <td className="px-3 py-3">{row.related_module ?? 'Not mapped'}</td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{[row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company-wide'}</td>
                <td className="px-3 py-3"><RegulatoryObligationApplicabilityBadge value={row.applicability_status} /></td>
                <td className="px-3 py-3"><RegulatoryComplianceStatusBadge status={row.compliance_status} /></td>
                <td className="px-3 py-3"><RegulatoryObligationStatusBadge value={row.obligation_status_calculated ?? row.obligation_status} /></td>
                <td className="px-3 py-3"><RegulatoryCriticalityBadge criticality={row.criticality} /></td>
                <td className="px-3 py-3">{row.frequency ?? row.trigger_event ?? 'Missing'}</td>
                <td className="px-3 py-3">{formatDate(row.next_due_date ?? row.due_date)}</td>
                <td className="px-3 py-3">{row.owner?.displayName ?? row.owner_label ?? 'Unassigned'}</td>
                <td className="px-3 py-3"><RegulatoryObligationEvidenceBadge value={row.evidence_expectation_status} /></td>
                <td className="px-3 py-3"><RegulatoryObligationMappingBadge value={row.module_mapping_status} /></td>
                <td className="px-3 py-3"><RegulatoryObligationStaleBadge value={row.stale_status} reason={row.stale_reason} /></td>
                <td className="px-3 py-3">{formatDate(row.updated_at)}</td>
                <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><RegulatoryButton href={`/regulatory/obligations/${row.id}`} variant="secondary">View</RegulatoryButton><RegulatoryButton href={`/regulatory/obligations/${row.id}/edit`} variant="secondary" disabled={Boolean(row.readOnly)} title={row.readOnlyReason ?? 'Edit obligation'}>Edit</RegulatoryButton></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RegulatoryObligationMobileCards rows={rows} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--psm-line)] p-3 text-sm text-[var(--psm-muted)]">
        <span>Showing {rows.length} of {register?.total ?? 0}</span>
        <div className="flex gap-2">
          <RegulatoryButton variant="secondary" disabled={(register?.page ?? 1) <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(Number(current.page ?? 1) - 1, 1) }))}>Previous</RegulatoryButton>
          <RegulatoryButton variant="secondary" disabled={!register?.hasMore} onClick={() => setFilters((current) => ({ ...current, page: Number(current.page ?? 1) + 1 }))}>Next</RegulatoryButton>
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Not Set';
  return new Date(value).toLocaleDateString();
}
