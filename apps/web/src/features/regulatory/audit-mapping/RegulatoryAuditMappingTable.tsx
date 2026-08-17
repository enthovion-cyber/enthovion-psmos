import Link from 'next/link';
import { RegulatoryAuditCoverageStatusBadge } from '../shared/RegulatoryAuditCoverageStatusBadge';
import { RegulatoryAuditMappingStatusBadge } from '../shared/RegulatoryAuditMappingStatusBadge';
import { RegulatoryAuditReadinessBadge } from '../shared/RegulatoryAuditReadinessBadge';
import { RegulatoryAuditStaleStatusBadge } from '../shared/RegulatoryAuditStaleStatusBadge';
import { RegulatoryAuditVerificationStatusBadge } from '../shared/RegulatoryAuditVerificationStatusBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';
import type { RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';
import { valueText } from './AuditMappingUi';

export function RegulatoryAuditMappingTable({ rows }: { rows?: RegulatoryAuditMappingRow[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No audit mappings found" message="The backend did not return any audit mappings for this filter and company/site scope." />;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr>{['Mapping', 'Regulatory Source', 'Audit Target', 'Coverage', 'Verification', 'Readiness', 'Stale', 'Owner / Due'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-3 py-3"><Link href={`/regulatory/audit-mapping/${row.id}`} className="font-semibold text-primary hover:underline">{valueText(row.mapping_code)} - {valueText(row.mapping_title, 'Untitled')}</Link><div className="mt-1"><RegulatoryAuditMappingStatusBadge value={row.mapping_status} /></div></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.regulatory_source_type)}<div className="text-xs">{valueText(row.regulatory_item_id ?? row.obligation_id ?? row.compliance_assessment_id ?? row.compliance_gap_id, 'No source ID')}</div></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.audit_target_type)}<div className="text-xs">{valueText(row.audit_program_id ?? row.audit_plan_id ?? row.audit_checklist_id ?? row.audit_finding_id ?? row.audit_capa_id ?? row.audit_evidence_id ?? row.audit_score_run_id, 'No target ID')}</div></td>
              <td className="px-3 py-3"><RegulatoryAuditCoverageStatusBadge value={row.coverage_status} /></td>
              <td className="px-3 py-3"><RegulatoryAuditVerificationStatusBadge value={row.verification_status} /></td>
              <td className="px-3 py-3"><RegulatoryAuditReadinessBadge value={row.audit_readiness_status} /></td>
              <td className="px-3 py-3"><RegulatoryAuditStaleStatusBadge value={row.stale_status} /></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.owner_label ?? row.owner_user_id, 'Unassigned')}<div className="text-xs">{valueText(row.due_date, 'No due date')}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
