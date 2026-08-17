import type { AuditProgram } from '../types/audit.types';
import { AuditButton } from '../shared/AuditUi';
import { AuditConfigurationHealthBadge } from '../shared/AuditConfigurationHealthBadge';
import { AuditCriticalityBadge } from '../shared/AuditCriticalityBadge';
import { AuditFrequencyBadge } from '../shared/AuditFrequencyBadge';
import { AuditProgramStatusBadge } from '../shared/AuditProgramStatusBadge';

export function AuditProgramTable({ rows, onArchive, onActivate, onReactivate, onSubmitReview }: { rows: AuditProgram[]; onArchive: (row: AuditProgram) => void; onActivate: (row: AuditProgram) => void; onReactivate: (row: AuditProgram) => void; onSubmitReview: (row: AuditProgram) => void }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Program Code','Program Title','Audit Type','Scope','Standards / Regulations','Modules Covered','Frequency','Owner','Reviewer','Status','Criticality','Review Due','Configuration Health','Actions'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => <tr key={row.id} className="align-top">
            <td className="px-3 py-3 font-semibold">{row.program_code}</td>
            <td className="px-3 py-3">{row.program_title}</td>
            <td className="px-3 py-3">{row.audit_type}</td>
            <td className="px-3 py-3">{(row.scopes ?? []).length}</td>
            <td className="px-3 py-3">{(row.standards ?? []).map((item) => item.standard_name).filter(Boolean).join(', ') || 'Missing'}</td>
            <td className="px-3 py-3">{(row.modules ?? []).map((item) => item.module_name).filter(Boolean).join(', ') || 'Missing'}</td>
            <td className="px-3 py-3"><AuditFrequencyBadge value={row.frequency?.audit_frequency} /></td>
            <td className="px-3 py-3">{row.owner?.displayName ?? row.owner_user_id ?? 'Missing'}</td>
            <td className="px-3 py-3">{row.reviewer?.displayName ?? row.reviewer_user_id ?? 'Missing'}</td>
            <td className="px-3 py-3"><AuditProgramStatusBadge status={row.program_status} /></td>
            <td className="px-3 py-3"><AuditCriticalityBadge value={row.criticality} /></td>
            <td className="px-3 py-3">{row.next_review_due ?? row.frequency?.next_program_review_due ?? 'Missing'}</td>
            <td className="px-3 py-3"><AuditConfigurationHealthBadge value={row.configuration_health} /></td>
            <td className="px-3 py-3"><RowActions row={row} onArchive={onArchive} onActivate={onActivate} onReactivate={onReactivate} onSubmitReview={onSubmitReview} /></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ row, onArchive, onActivate, onReactivate, onSubmitReview }: { row: AuditProgram; onArchive: (row: AuditProgram) => void; onActivate: (row: AuditProgram) => void; onReactivate: (row: AuditProgram) => void; onSubmitReview: (row: AuditProgram) => void }) {
  const archived = row.program_status === 'Archived' || Boolean(row.archived_at);
  return <div className="flex min-w-64 flex-wrap gap-2"><AuditButton href={`/audit-compliance/programs/${row.id}`} variant="secondary">View</AuditButton><AuditButton href={`/audit-compliance/programs/${row.id}/edit`} variant="secondary" disabled={archived} title="Archived programs are read-only until reactivated.">Edit</AuditButton>{archived ? <AuditButton onClick={() => onReactivate(row)} variant="secondary">Reactivate</AuditButton> : <><AuditButton onClick={() => onActivate(row)} variant="secondary" disabled={row.configuration_health !== 'Complete'} title={row.configuration_health !== 'Complete' ? `Activation blocked: ${row.configuration_health}` : 'Activate this complete program.'}>Activate</AuditButton><AuditButton onClick={() => onSubmitReview(row)} variant="secondary">Submit Review</AuditButton><AuditButton onClick={() => onArchive(row)} variant="danger">Archive</AuditButton></>}</div>;
}
