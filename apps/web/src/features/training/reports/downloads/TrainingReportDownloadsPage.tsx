'use client';
import { useTrainingReportDownloads } from '../../hooks/useTrainingReports';
import { downloadColumns, TrainingReportsListPage } from '../shared';
export function TrainingReportDownloadsPage() { const query = useTrainingReportDownloads(); return <TrainingReportsListPage title="Download History" subtitle="Controlled download events with redaction, classification and allowed/blocked status." query={query} columns={downloadColumns} />; }
