'use client';
import { TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { useTrainingGeneratedReport } from '../../hooks/useTrainingReports';
import { TrainingReportDetailPanel, TrainingReportsLayout } from '../shared';
export function GeneratedReportDetailPage({ reportId }: { reportId: string }) { const query = useTrainingGeneratedReport(reportId); if (query.isLoading) return <TrainingLoadingState rows={4} />; if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />; return <TrainingReportsLayout title="Generated Report Detail" subtitle="Generated report snapshot, files, export history, download controls and audit metadata."><TrainingReportDetailPanel data={query.data} /></TrainingReportsLayout>; }
