'use client';
import { TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { useTrainingReportPackage } from '../../hooks/useTrainingReports';
import { TrainingReportDetailPanel, TrainingReportsLayout } from '../shared';
export function TrainingReportPackageDetailPage({ packageId }: { packageId: string }) { const query = useTrainingReportPackage(packageId); if (query.isLoading) return <TrainingLoadingState rows={4} />; if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />; return <TrainingReportsLayout title="Evidence Package Detail" subtitle="Package manifest, included items, generated files, custody/download history and audit evidence."><TrainingReportDetailPanel data={query.data} /></TrainingReportsLayout>; }
