import Link from 'next/link';
import type { SopAckAssignment } from '../types/sop-acknowledgement.types';
import { CurrentVersionGapBadge } from '../shared/CurrentVersionGapBadge';
import { SopAckAssessmentStatusBadge } from '../shared/SopAckAssessmentStatusBadge';
import { SopAckAssignmentStatusBadge } from '../shared/SopAckAssignmentStatusBadge';
import { SopAckEsignatureStatusBadge } from '../shared/SopAckEsignatureStatusBadge';
import { SopAckVerificationStatusBadge } from '../shared/SopAckVerificationStatusBadge';
import { TrainingBadge, TrainingEmptyState } from '../shared/TrainingUi';

export function SopAckAssignmentTable({ rows }: { rows: SopAckAssignment[] }) {
  if (!rows.length) return <TrainingEmptyState title="No SOP acknowledgement assignments" message="No worker assignments match this scope/filter. Generate assignments from an active requirement." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Worker', 'SOP/document', 'Required version', 'Requirement', 'Source / why required', 'Scope', 'Due date', 'Acknowledgement', 'Verification', 'E-signature', 'Assessment', 'Overdue', 'Current version', 'Blocking impact', 'Action / waiver', 'Notification', 'Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
            <td className="px-3 py-3 font-semibold">{row.worker?.display_name ?? row.worker_id}<div className="text-xs text-[var(--psm-muted)]">{row.worker?.work_email ?? row.worker?.employee_id ?? row.worker?.contractor_id ?? 'No identifier'}</div></td>
            <td className="px-3 py-3">{row.requirement?.sop_title ?? row.requirement?.document_number ?? row.document_id ?? row.sop_id ?? 'Document link missing'}</td>
            <td className="px-3 py-3">{row.required_version ?? 'Current approved'}</td>
            <td className="px-3 py-3">{row.requirement?.requirement_title ?? row.requirement_id}</td>
            <td className="px-3 py-3">{row.assignment_source}<div className="text-xs text-[var(--psm-muted)]">{row.required_because ?? '-'}</div></td>
            <td className="px-3 py-3">{[row.site_id, row.unit_id, row.area_id].filter(Boolean).join(' / ') || 'Company'}</td>
            <td className="px-3 py-3">{row.due_date ?? '-'}</td>
            <td className="px-3 py-3"><SopAckAssignmentStatusBadge value={row.runtime_status ?? row.acknowledgement_status} /></td>
            <td className="px-3 py-3"><SopAckVerificationStatusBadge value={row.verification_status ?? null} /></td>
            <td className="px-3 py-3"><SopAckEsignatureStatusBadge value={row.esignature_status ?? null} /></td>
            <td className="px-3 py-3"><SopAckAssessmentStatusBadge value={row.assessment_status ?? null} /></td>
            <td className="px-3 py-3">{row.runtime_overdue ? <TrainingBadge tone="danger">Overdue</TrainingBadge> : <TrainingBadge tone="good">On track</TrainingBadge>}</td>
            <td className="px-3 py-3"><CurrentVersionGapBadge value={row.runtime_current_version_gap ?? row.current_version_gap} /></td>
            <td className="px-3 py-3">{[row.ptw_blocker && 'PTW', row.moc_blocker && 'MOC', row.pssr_blocker && 'PSSR', row.safety_critical_work_blocker && 'Safety-critical work'].filter(Boolean).join(', ') || 'None'}</td>
            <td className="px-3 py-3">{row.action_id ?? row.waiver_id ?? '-'}</td>
            <td className="px-3 py-3">{row.last_notification_sent_at ?? 'Not sent'}</td>
            <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link className="font-semibold text-primary" href={`/training-competency/sop-acknowledgements/assignments?assignmentId=${row.id}`}>View</Link><Link className="font-semibold text-primary" href={`/training-competency/workforce/${row.worker_id}/sop-acknowledgements`}>Worker</Link></div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
