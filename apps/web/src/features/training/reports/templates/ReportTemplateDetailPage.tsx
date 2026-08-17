'use client';
import { TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { useTrainingReportTemplate } from '../../hooks/useTrainingReports';
import { TrainingReportDetailPanel, TrainingReportsLayout } from '../shared';
export function ReportTemplateDetailPage({ templateId }: { templateId: string }) { const query = useTrainingReportTemplate(templateId); if (query.isLoading) return <TrainingLoadingState rows={4} />; if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />; return <TrainingReportsLayout title="Report Template Detail" subtitle="Template metadata, sections, columns, formats, versioning and history."><TrainingReportDetailPanel data={query.data} /></TrainingReportsLayout>; }
