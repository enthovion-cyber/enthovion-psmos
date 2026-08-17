import Link from 'next/link';
import type { RegulatoryItem, RegulatoryRegister } from './types/regulatory.types';
import { RegulatoryStatusBadge } from './shared/RegulatoryStatusBadge';
import { RegulatoryApplicabilityBadge } from './shared/RegulatoryApplicabilityBadge';
import { RegulatoryComplianceStatusBadge } from './shared/RegulatoryComplianceStatusBadge';
import { RegulatoryCriticalityBadge } from './shared/RegulatoryCriticalityBadge';
import { RegulatoryButton, RegulatoryCard } from './shared/RegulatoryUi';
import { RegulatoryRegisterMobileCards } from './RegulatoryRegisterMobileCards';

const columns = ['Requirement Code', 'Title', 'Source Type', 'Authority / Issuing Body', 'Jurisdiction', 'Category', 'Applicability', 'Compliance Status', 'Register Status', 'Criticality', 'Scope', 'Owner', 'Review Due', 'Effective Date', 'Linked Audit', 'Linked Evidence', 'Linked Actions', 'Updated At', 'Actions'];

export function RegulatoryRegisterTable({ register, setFilters }: { register?: RegulatoryRegister | undefined; setFilters: (fn: (filters: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const rows = register?.rows ?? [];
  return (
    <RegulatoryCard title="Regulatory Register Table" subtitle="Server-side pagination, filtering, sorting, and site-scoped data from the backend.">
      <div className="hidden overflow-x-auto lg:block">
        {rows.length ? <table className="min-w-[1800px] w-full text-left text-xs"><thead className="text-[var(--psm-muted)]"><tr>{columns.map((column) => <th key={column} className="p-2">{column}</th>)}</tr></thead><tbody>{rows.map((row) => <RegisterRow key={row.id} row={row} />)}</tbody></table> : <p className="text-sm text-[var(--psm-muted)]">No regulatory register items match the current filters.</p>}
      </div>
      <div className="lg:hidden"><RegulatoryRegisterMobileCards rows={rows} /></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--psm-muted)]">
        <span>Page {register?.page ?? 1} · showing {rows.length} of {register?.total ?? 0}</span>
        <div className="flex gap-2">
          <RegulatoryButton variant="secondary" disabled={(register?.page ?? 1) <= 1} title={(register?.page ?? 1) <= 1 ? 'Already on the first page.' : 'Previous page'} onClick={() => setFilters((filters) => ({ ...filters, page: Math.max(1, Number(filters.page ?? 1) - 1) }))}>Previous</RegulatoryButton>
          <RegulatoryButton variant="secondary" disabled={!register?.hasMore} title={!register?.hasMore ? 'No more register rows.' : 'Next page'} onClick={() => setFilters((filters) => ({ ...filters, page: Number(filters.page ?? 1) + 1 }))}>Next</RegulatoryButton>
        </div>
      </div>
    </RegulatoryCard>
  );
}

function RegisterRow({ row }: { row: RegulatoryItem }) {
  return (
    <tr className="border-t border-[var(--psm-line)] align-top">
      <td className="p-2 font-semibold text-primary">{row.requirement_code}</td>
      <td className="p-2"><Link className="font-semibold text-[var(--psm-fg)] hover:text-primary" href={`/regulatory/${row.id}`}>{row.requirement_title ?? 'Untitled draft'}</Link><div className="text-[var(--psm-muted)]">{row.short_summary ?? 'No summary provided.'}</div></td>
      <td className="p-2">{row.source_type ?? '-'}</td>
      <td className="p-2">{row.authority_name ?? '-'}</td>
      <td className="p-2">{row.jurisdiction_level ?? '-'}</td>
      <td className="p-2">{row.category ?? '-'}</td>
      <td className="p-2"><RegulatoryApplicabilityBadge status={row.applicability_status} /></td>
      <td className="p-2"><RegulatoryComplianceStatusBadge status={row.compliance_status} /></td>
      <td className="p-2"><RegulatoryStatusBadge status={row.register_status} /></td>
      <td className="p-2"><RegulatoryCriticalityBadge criticality={row.criticality} /></td>
      <td className="p-2">{[row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company-wide'}</td>
      <td className="p-2">{row.owner?.displayName ?? row.owner_user_id ?? 'Missing owner'}</td>
      <td className="p-2">{row.next_review_date ?? '-'}</td>
      <td className="p-2">{row.effective_date ?? '-'}</td>
      <td className="p-2">{row.linked_audit_count ?? 0}</td>
      <td className="p-2">{row.linked_evidence_count ?? 0}</td>
      <td className="p-2">{row.linked_action_count ?? 0}</td>
      <td className="p-2">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</td>
      <td className="p-2"><div className="flex flex-wrap gap-1"><RegulatoryButton href={`/regulatory/${row.id}`} variant="secondary">View</RegulatoryButton><RegulatoryButton href={`/regulatory/${row.id}/edit`} variant="secondary" disabled={!!row.readOnly} title={row.readOnlyReason ?? 'Edit'}>Edit</RegulatoryButton><RegulatoryButton href={`/regulatory/${row.id}/history`} variant="secondary">History</RegulatoryButton></div></td>
    </tr>
  );
}
