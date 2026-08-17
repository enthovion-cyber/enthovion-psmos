import Link from 'next/link';
import type { SopAckRequirement } from '../types/sop-acknowledgement.types';
import { SopAckRequirementStatusBadge } from '../shared/SopAckRequirementStatusBadge';
import { SopVersionStatusBadge } from '../shared/SopVersionStatusBadge';
import { TrainingBadge, TrainingEmptyState } from '../shared/TrainingUi';

export function SopAckRequirementTable({ rows }: { rows: SopAckRequirement[] }) {
  if (!rows.length) return <TrainingEmptyState title="No SOP acknowledgement requirements" message="Create a requirement linked to SOP Library or Document Control to generate worker assignments." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Requirement', 'SOP / Procedure', 'SOP Version', 'Scope', 'Due Rule', 'Re-Ack Rule', 'Assigned', 'Pending', 'Overdue', 'Completed', 'Version Gaps', 'Safety', 'Blockers', 'Status', 'Owner', 'Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
            <td className="px-3 py-3 font-semibold"><Link className="text-primary" href={`/training-competency/sop-acknowledgements/requirements/${row.id}`}>{row.requirement_title}</Link><div className="text-xs text-[var(--psm-muted)]">{row.requirement_code} / {row.requirement_source}</div></td>
            <td className="px-3 py-3">{row.sop_title ?? row.document_number ?? 'Missing SOP/document'}<div className="text-xs text-[var(--psm-muted)]">{row.document_status ?? 'Status from Document Control required'}</div></td>
            <td className="px-3 py-3"><SopVersionStatusBadge required={row.required_version ?? null} current={row.current_version_at_requirement ?? null} /></td>
            <td className="px-3 py-3">{row.site_id ?? 'Company/shared'}</td>
            <td className="px-3 py-3">{row.effective_date ?? 'Backend calculated'}</td>
            <td className="px-3 py-3">{row.current_version_policy}</td>
            {['assigned_workers', 'pending', 'overdue', 'completed', 'current_version_gaps'].map((key) => <td key={key} className="px-3 py-3">{(row as any)[key] ?? '-'}</td>)}
            <td className="px-3 py-3">{row.safety_critical || row.psm_critical ? <TrainingBadge tone="warn">Critical</TrainingBadge> : <TrainingBadge>Standard</TrainingBadge>}</td>
            <td className="px-3 py-3">{[row.blocks_ptw_authorization && 'PTW', row.blocks_moc_implementation && 'MOC', row.blocks_pssr_startup && 'PSSR', row.blocks_safety_critical_work && 'Safety work'].filter(Boolean).join(', ') || 'None'}</td>
            <td className="px-3 py-3"><SopAckRequirementStatusBadge value={row.requirement_status} /></td>
            <td className="px-3 py-3">{row.owner_user_id ?? 'Missing owner'}</td>
            <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link className="font-semibold text-primary" href={`/training-competency/sop-acknowledgements/requirements/${row.id}`}>View</Link><Link className="font-semibold text-primary" href={`/training-competency/sop-acknowledgements/requirements/${row.id}/edit`}>Edit</Link><Link className="font-semibold text-primary" href={`/training-competency/sop-acknowledgements/assignments?requirementId=${row.id}`}>Assignments</Link></div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
