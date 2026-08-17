'use client';

import { useTrainingDashboard } from '../hooks/useTrainingDashboard';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RecentTrainingHistory } from './RecentTrainingHistory';
import { TrainingDashboardHeader } from './TrainingDashboardHeader';
import { TrainingOverduePreview } from './TrainingOverduePreview';
import { TrainingReadinessBySite } from './TrainingReadinessBySite';
import { TrainingReadinessByUnit } from './TrainingReadinessByUnit';
import { TrainingSummaryCards } from './TrainingSummaryCards';

export function TrainingDashboardPage() {
  const query = useTrainingDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-6">
      <TrainingDashboardHeader header={data?.header ?? {}} />
      <TrainingSummaryCards summary={data?.summary ?? {}} />
      <div className="grid gap-4 xl:grid-cols-2">
        <TrainingReadinessBySite rows={data?.readinessBySite ?? []} />
        <TrainingReadinessByUnit rows={data?.readinessByUnit ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <TrainingOverduePreview workers={data?.overduePreview ?? []} title="Overdue Training" />
        <TrainingOverduePreview workers={data?.safetyCriticalGapsPreview ?? []} title="Safety-Critical Gaps" />
        <TrainingOverduePreview workers={data?.ptwAuthorizationGapsPreview ?? []} title="PTW Authorization Gaps" />
      </div>
      <TrainingCard title="Reports / Export" subtitle="Training compliance reports, evidence packages, scheduled exports and controlled download history.">
        <div className="flex flex-wrap gap-2">
          <TrainingButton href="/training-competency/reports">Open Reports</TrainingButton>
          <TrainingButton href="/training-competency/reports/export/new" variant="secondary">Generate Export</TrainingButton>
          <TrainingButton href="/training-competency/reports/packages" variant="secondary">Evidence Packages</TrainingButton>
        </div>
      </TrainingCard>
      <TrainingCard title="Final Integration + Production Hardening" subtitle="Unified compliance snapshots, data quality, integration health, route health, RLS/permission audit and production hardening checks.">
        <div className="flex flex-wrap gap-2">
          <TrainingButton href="/training-competency/final-integration">Open Final Integration</TrainingButton>
          <TrainingButton href="/training-competency/final-integration/data-quality" variant="secondary">Data Quality</TrainingButton>
          <TrainingButton href="/training-competency/final-integration/integration-health" variant="secondary">Integration Health</TrainingButton>
          <TrainingButton href="/training-competency/final-integration/route-health" variant="secondary">Route Health</TrainingButton>
        </div>
      </TrainingCard>
      <RecentTrainingHistory rows={data?.recentTrainingHistoryEvents ?? []} />
    </div>
  );
}
