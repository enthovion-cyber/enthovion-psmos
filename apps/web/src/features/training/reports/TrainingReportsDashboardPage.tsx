'use client';

import { TrainingButton, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingReportsDashboard } from '../hooks/useTrainingReports';
import { TrainingReportsDashboardContent, TrainingReportsLayout } from './shared';

export function TrainingReportsDashboardPage() {
  const query = useTrainingReportsDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={7} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return (
    <TrainingReportsLayout title={query.data?.header?.title ?? 'Training Reports / Export'} subtitle={query.data?.header?.subtitle ?? 'Audit-ready reports, controlled exports, evidence packages, schedules and download history.'} actions={<><TrainingButton href="/training-competency/reports/export/new">New Export</TrainingButton><TrainingButton href="/training-competency/reports/templates/new" variant="secondary">New Template</TrainingButton><TrainingButton variant="secondary" onClick={() => query.refetch()}>Refresh</TrainingButton></>}>
      <TrainingReportsDashboardContent data={query.data} />
    </TrainingReportsLayout>
  );
}
