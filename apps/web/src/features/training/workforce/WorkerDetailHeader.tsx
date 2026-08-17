import { AccountLinkStatusBadge } from '../shared/AccountLinkStatusBadge';
import { CertificationStatusBadge } from '../shared/CertificationStatusBadge';
import { CompetencyStatusBadge } from '../shared/CompetencyStatusBadge';
import { PtwAuthorizationStatusBadge } from '../shared/PtwAuthorizationStatusBadge';
import { SafetyCriticalRoleBadge } from '../shared/SafetyCriticalRoleBadge';
import { TrainingButton } from '../shared/TrainingUi';
import { TrainingStatusBadge } from '../shared/TrainingStatusBadge';
import { WorkerStatusBadge } from '../shared/WorkerStatusBadge';
import type { WorkerDetail } from '../types/training.types';

export function WorkerDetailHeader({ detail }: { detail: WorkerDetail }) {
  const worker = detail.worker;
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Worker Profile</p>
          <h1 className="mt-2 text-3xl font-bold">{worker.display_name}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{worker.work_email ?? worker.employee_id ?? worker.contractor_id ?? worker.badge_number} · {worker.job_title ?? 'Role missing'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingButton href={`/training-competency/workforce/${worker.id}/edit`} variant="secondary">Edit</TrainingButton>
          <TrainingButton href="/training-competency/workforce" variant="secondary">Registry</TrainingButton>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <WorkerStatusBadge status={worker.status} />
        <TrainingStatusBadge status={worker.training_status} />
        <CertificationStatusBadge status={worker.certification_status} />
        <CompetencyStatusBadge status={worker.competency_status} />
        <PtwAuthorizationStatusBadge status={worker.ptw_authorization_status} />
        <SafetyCriticalRoleBadge value={worker.safety_critical_role} />
        <AccountLinkStatusBadge status={detail.accountLink?.link_status ?? 'Not Linked'} />
      </div>
    </div>
  );
}
