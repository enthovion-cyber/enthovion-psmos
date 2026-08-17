'use client';
import { TrainingButton } from '../../shared/TrainingUi';
import { TrainingReportGeneratorForm, TrainingReportsLayout } from '../shared';
export function ReportTemplateFormPage() { return <TrainingReportsLayout title="Report Template Builder" subtitle="Create or update backend-governed report templates, section selections, formats and classification." actions={<TrainingButton href="/training-competency/reports/templates" variant="secondary">Back</TrainingButton>}><TrainingReportGeneratorForm mode="template" /></TrainingReportsLayout>; }
