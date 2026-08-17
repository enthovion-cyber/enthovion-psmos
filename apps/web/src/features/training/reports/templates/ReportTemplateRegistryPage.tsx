'use client';
import { TrainingButton } from '../../shared/TrainingUi';
import { useTrainingReportTemplates } from '../../hooks/useTrainingReports';
import { templateColumns, TrainingReportsListPage } from '../shared';
export function ReportTemplateRegistryPage() { const query = useTrainingReportTemplates(); return <TrainingReportsListPage title="Report Templates" subtitle="Template register with formats, sections, columns, scope, classification and lifecycle." query={query} columns={templateColumns} actions={<TrainingButton href="/training-competency/reports/templates/new">New Template</TrainingButton>} />; }
