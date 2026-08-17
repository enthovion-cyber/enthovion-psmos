'use client';
import { useTrainingGeneratedReports } from '../../hooks/useTrainingReports';
import { generatedColumns, TrainingReportsListPage } from '../shared';
export function GeneratedReportsRegisterPage() { const query = useTrainingGeneratedReports(); return <TrainingReportsListPage title="Generated Reports Register" subtitle="Generated reports, files, source snapshots, classification and lifecycle." query={query} columns={generatedColumns} />; }
