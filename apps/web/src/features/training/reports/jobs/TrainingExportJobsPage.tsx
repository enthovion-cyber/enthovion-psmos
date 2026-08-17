'use client';
import { useTrainingExportJobs } from '../../hooks/useTrainingReports';
import { jobColumns, TrainingReportsListPage } from '../shared';
export function TrainingExportJobsPage() { const query = useTrainingExportJobs(); return <TrainingReportsListPage title="Export Jobs" subtitle="Queued, running, completed, warning, failed and cancelled export jobs." query={query} columns={jobColumns} />; }
