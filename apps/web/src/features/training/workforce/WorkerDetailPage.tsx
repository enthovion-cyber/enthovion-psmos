'use client';

import { useWorkerDetail } from '../hooks/useWorkerDetail';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { WorkerDetailHeader } from './WorkerDetailHeader';
import { WorkerAccountLinkTab } from './tabs/WorkerAccountLinkTab';
import { WorkerAssignmentsTab } from './tabs/WorkerAssignmentsTab';
import { WorkerCertificationsSummaryTab } from './tabs/WorkerCertificationsSummaryTab';
import { WorkerDocumentsTab } from './tabs/WorkerDocumentsTab';
import { WorkerEmploymentTab } from './tabs/WorkerEmploymentTab';
import { WorkerHistoryTab } from './tabs/WorkerHistoryTab';
import { WorkerIdentityTab } from './tabs/WorkerIdentityTab';
import { WorkerMocPssrReadinessTab } from './tabs/WorkerMocPssrReadinessTab';
import { WorkerOverviewTab } from './tabs/WorkerOverviewTab';
import { WorkerPtwAuthorizationFoundationTab } from './tabs/WorkerPtwAuthorizationFoundationTab';
import { WorkerReviewApprovalTab } from './tabs/WorkerReviewApprovalTab';
import { WorkerRolesCompetencyTab } from './tabs/WorkerRolesCompetencyTab';
import { WorkerTrainingSummaryTab } from './tabs/WorkerTrainingSummaryTab';
import { WorkerSopAcknowledgementsPage } from '../sop-ack/WorkerSopAcknowledgementsPage';

export function WorkerDetailPage({ workerId, tab = 'overview' }: { workerId: string; tab?: string }) {
  const query = useWorkerDetail(workerId);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const detail = query.data!;
  const current = tabComponent(tab, detail);
  return (
    <div className="space-y-5">
      <WorkerDetailHeader detail={detail} />
      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-sm">
        {[
          ['overview', 'Overview'],
          ['identity', 'Identity'],
          ['employment', 'Employment'],
          ['assignments', 'Assignments'],
          ['roles', 'Roles'],
          ['training-summary', 'Training Summary'],
          ['sop', 'SOP Acknowledgements'],
          ['documents', 'Documents'],
          ['account', 'Account'],
          ['history', 'History']
        ].map(([key, label]) => <a key={key} href={`/training-competency/workforce/${workerId}${key === 'overview' ? '' : `/${key === 'account' ? 'profile' : key === 'sop' ? 'sop-acknowledgements' : key}`}`} className={`shrink-0 rounded-lg px-3 py-2 ${tab === key || (tab === 'overview' && key === 'overview') ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{label}</a>)}
      </nav>
      {current}
    </div>
  );
}

function tabComponent(tab: string, detail: any) {
  if (tab === 'identity') return <WorkerIdentityTab worker={detail.worker} />;
  if (tab === 'employment') return <WorkerEmploymentTab worker={detail.worker} />;
  if (tab === 'assignments') return <WorkerAssignmentsTab rows={detail.assignments} />;
  if (tab === 'roles') return <WorkerRolesCompetencyTab rows={detail.roleAssignments} />;
  if (tab === 'training-summary') return <WorkerTrainingSummaryTab summary={detail.trainingSummary} />;
  if (tab === 'certifications') return <WorkerCertificationsSummaryTab summary={detail.trainingSummary} />;
  if (tab === 'ptw') return <WorkerPtwAuthorizationFoundationTab summary={detail.trainingSummary} />;
  if (tab === 'sop') return <WorkerSopAcknowledgementsPage workerId={detail.worker.id} />;
  if (tab === 'moc-pssr') return <WorkerMocPssrReadinessTab summary={detail.trainingSummary} />;
  if (tab === 'documents') return <WorkerDocumentsTab rows={detail.documents} />;
  if (tab === 'account') return <WorkerAccountLinkTab row={detail.accountLink} />;
  if (tab === 'review') return <WorkerReviewApprovalTab />;
  if (tab === 'history') return <WorkerHistoryTab rows={detail.history} />;
  return <WorkerOverviewTab detail={detail} />;
}
