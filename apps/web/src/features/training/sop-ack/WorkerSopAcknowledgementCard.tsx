import type { SopAckAssignment } from '../types/sop-acknowledgement.types';
import { CurrentVersionGapBadge } from '../shared/CurrentVersionGapBadge';
import { SopAckAssignmentStatusBadge } from '../shared/SopAckAssignmentStatusBadge';
import { TrainingBadge, TrainingButton } from '../shared/TrainingUi';

export function WorkerSopAcknowledgementCard({ row }: { row: SopAckAssignment }) {
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{row.requirement?.sop_title ?? row.requirement?.document_number ?? row.sop_id ?? row.document_id ?? 'SOP acknowledgement'}</h3>
          <p className="text-sm text-[var(--psm-muted)]">{row.required_because ?? row.assignment_source}</p>
        </div>
        <SopAckAssignmentStatusBadge value={row.runtime_status ?? row.acknowledgement_status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <TrainingBadge>Due {row.due_date ?? 'not set'}</TrainingBadge>
        <TrainingBadge>Version {row.required_version ?? 'not set'}</TrainingBadge>
        <CurrentVersionGapBadge value={Boolean(row.runtime_current_version_gap ?? row.current_version_gap)} />
        {row.ptw_blocker || row.moc_blocker || row.pssr_blocker ? <TrainingBadge tone="danger">Work blocker</TrainingBadge> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <TrainingButton href={`/training-competency/sop-acknowledgements/assignments?assignmentId=${row.id}`}>Open</TrainingButton>
        <TrainingButton href={`/training-competency/sop-acknowledgements/assignments?assignmentId=${row.id}&acknowledge=1`} variant="secondary">Acknowledge</TrainingButton>
      </div>
    </article>
  );
}
