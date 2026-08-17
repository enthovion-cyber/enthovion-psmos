'use client';
import { TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { useTrainingExportJob } from '../../hooks/useTrainingReports';
import { TrainingReportDetailPanel, TrainingReportsLayout } from '../shared';
export function TrainingExportJobDetailPage({ jobId }: { jobId: string }) { const query = useTrainingExportJob(jobId); if (query.isLoading) return <TrainingLoadingState rows={4} />; if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />; return <TrainingReportsLayout title="Export Job Detail" subtitle="Job status, progress, source scope, warning/error metadata and retry/cancel audit trail."><TrainingReportDetailPanel data={query.data} /></TrainingReportsLayout>; }
