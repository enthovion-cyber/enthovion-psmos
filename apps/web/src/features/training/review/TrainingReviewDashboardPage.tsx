'use client';

import { TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { useTrainingReviewDashboard } from '../hooks/useTrainingReviewDashboard';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewSummaryCards } from './TrainingReviewSummaryCards';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';
import { moduleCounts } from '../services/training-review.service';

export function TrainingReviewDashboardPage() {
  const query = useTrainingReviewDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={8} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-6">
      <TrainingReviewHeader title={data?.header?.title} subtitle={data?.header?.subtitle} onRefresh={() => query.refetch()} />
      <TrainingReviewSummaryCards summary={data?.summary} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Breakdown title="Pending by module" rows={moduleCounts(data?.pendingByModule)} />
        <Breakdown title="Approval workload by role" rows={moduleCounts(data?.approvalWorkloadByRole)} />
        <Breakdown title="SLA performance" rows={moduleCounts(data?.slaPerformance)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrainingCard title="My review inbox preview" subtitle="Assigned to the current user or their delegated reviewer role."><TrainingReviewInboxTable rows={data?.inboxPreview} title="Inbox Preview" /></TrainingCard>
        <TrainingCard title="Overdue reviews" subtitle="Backend-calculated SLA breaches and due-date blockers."><TrainingReviewInboxTable rows={data?.overduePreview} title="Overdue Preview" /></TrainingCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Preview title="Safety-critical pending approvals" rows={data?.safetyCriticalPending} />
        <Preview title="Waiver approvals" rows={data?.waiverApprovals} />
        <Preview title="Stale approval packages" rows={data?.staleApprovalPackages} />
        <Preview title="Validation failures" rows={data?.validationFailurePreview} />
        <Preview title="Recent approvals" rows={data?.recentApprovals} />
        <Preview title="Recent rejections / returns" rows={data?.recentRejectionsReturns} />
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <TrainingCard title={title}>{rows.map((row) => <div key={row.label} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><strong>{row.count}</strong></div><TrainingProgress value={(row.count / max) * 100} /></div>)}</TrainingCard>;
}
function Preview({ title, rows }: { title: string; rows?: Record<string, any>[] | undefined }) {
  return <TrainingCard title={title}>{rows?.length ? <div className="space-y-2">{rows.slice(0, 6).map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{row.approval_title}</p><p className="text-xs text-[var(--psm-muted)]">{row.source_module} / {row.approval_status}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend records for this section.</p>}</TrainingCard>;
}
