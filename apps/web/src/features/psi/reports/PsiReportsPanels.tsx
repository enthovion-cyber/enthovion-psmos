'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PsiButton, PsiCard, PsiEmptyState, PsiErrorState, PsiLoadingState, PsiMetricCard, PsiProgress } from '../shared/PsiUi';
import { DocumentExcludedBadge } from '../shared/DocumentExcludedBadge';
import { DocumentIncludedBadge } from '../shared/DocumentIncludedBadge';
import { ExportFormatBadge } from '../shared/ExportFormatBadge';
import { ExportStatusBadge } from '../shared/ExportStatusBadge';
import { GeneratedWithWarningsBadge } from '../shared/GeneratedWithWarningsBadge';
import { PackageTypeBadge } from '../shared/PackageTypeBadge';
import { ReportStatusBadge } from '../shared/ReportStatusBadge';
import { ReportTypeBadge } from '../shared/ReportTypeBadge';
import { usePsiExportJob, usePsiExportJobs } from '../hooks/usePsiExportJobs';
import { usePsiExportPackage, usePsiExportPackages } from '../hooks/usePsiExportPackages';
import { usePsiGeneratedReports } from '../hooks/usePsiGeneratedReports';
import { usePsiReportBuilder } from '../hooks/usePsiReportBuilder';
import { usePsiReportDetail, usePsiReportPreview } from '../hooks/usePsiReportDetail';
import { usePsiReportSettings } from '../hooks/usePsiReportSettings';
import { usePsiReportTemplate, usePsiReportTemplates } from '../hooks/usePsiReportTemplates';
import { usePsiReportsDashboard } from '../hooks/usePsiReportsDashboard';
import { usePsiScheduledReport, usePsiScheduledReports } from '../hooks/usePsiScheduledReports';
import { psiReportService } from '../services/psi-report.service';
import type { PsiExportJob, PsiExportPackage, PsiGeneratedReport, PsiReportFile, PsiReportTemplate, PsiScheduledReport } from '../types/psi-report.types';

const moduleKeys = ['units', 'chemicals', 'process-chemistry', 'safe-operating-limits', 'equipment-design', 'relief-systems', 'drawings', 'electrical-classification', 'material-compatibility', 'safeguards', 'completeness', 'review-approval', 'documents', 'integrations'];
const scopeTypes = ['Site', 'Unit', 'Equipment', 'Company', 'Module'];

export function PsiReportsDashboardPage() {
  const query = usePsiReportsDashboard({ page: 1, limit: 10 });
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load PSI reports dashboard.'} onRetry={() => void query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-5">
      <PsiReportsHeader lastUpdated={data?.header?.lastUpdated} onRefresh={() => void query.refetch()} />
      <PsiReportsSummaryCards summary={data?.summary} />
      <PsiReportsFilters />
      <div className="grid gap-5 xl:grid-cols-3">
        <AttentionPanel rows={data?.attention ?? []} />
        <TemplateMiniPanel rows={data?.templates?.rows ?? []} />
        <ScheduledMiniPanel rows={data?.scheduledReports?.rows ?? []} />
        <GeneratedReportsTable rows={data?.generated?.rows ?? []} className="xl:col-span-3" />
        <ExportJobsTable rows={data?.exportJobs?.rows ?? []} className="xl:col-span-2" />
        <ExportPackagesTable rows={data?.exportPackages?.rows ?? []} />
        <HistoryPanel rows={data?.history ?? []} className="xl:col-span-3" />
      </div>
    </div>
  );
}

export function PsiReportsHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">Reports / Export</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Generate audit-ready PSI reports, evidence packages, scheduled exports, and controlled report files from current PSI data.</p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {formatDate(lastUpdated)}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href="/process-safety-information/reports/export/new" variant="secondary">New Export</PsiButton>
          <PsiButton href="/process-safety-information/reports/templates/new" variant="secondary">New Template</PsiButton>
          <PsiButton href="/process-safety-information/reports/generated">Generated Reports</PsiButton>
          <PsiButton onClick={onRefresh} variant="secondary">Refresh</PsiButton>
        </div>
      </div>
    </div>
  );
}

export function PsiReportsSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  const cards = [
    ['Generated Reports', summary?.generatedReports, '/process-safety-information/reports/generated'],
    ['Scheduled Reports', summary?.scheduledReports, '/process-safety-information/reports/scheduled'],
    ['Export Packages', summary?.exportPackages, '/process-safety-information/reports/export/packages'],
    ['Generated This Month', summary?.reportsGeneratedThisMonth],
    ['Failed Jobs', summary?.failedReportJobs, undefined, 'danger'],
    ['Pending Jobs', summary?.pendingReportJobs, undefined, 'warn'],
    ['Audit Packages', summary?.auditPackagesGenerated],
    ['PSSR Packages', summary?.pssrPackagesGenerated],
    ['MOC Packages', summary?.mocPackagesGenerated],
    ['HAZOP PSI Packages', summary?.hazopPsiPackagesGenerated],
    ['Unit PSI Reports', summary?.unitPsiReports],
    ['Equipment PSI Reports', summary?.equipmentPsiReports],
    ['Downloads This Month', summary?.downloadsThisMonth],
    ['Large Exports Running', summary?.largeExportsInProgress, undefined, 'warn'],
    ['Requires Regeneration', summary?.reportsRequiringRegeneration, undefined, 'warn'],
    ['Schedules Due Soon', summary?.scheduledReportsDueSoon, undefined, 'warn']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, href, tone]) => <PsiMetricCard key={label} label={label} value={value ?? 0} href={href} tone={tone as any} />)}</div>;
}

export function PsiReportsFilters() {
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side filters are available on each register; this dashboard shows the current selected company/site scope.">
      <div className="grid gap-3 md:grid-cols-4">
        {['Report type', 'Scope', 'Status', 'Date range'].map((label) => (
          <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-muted)]">{label}</div>
        ))}
      </div>
    </PsiCard>
  );
}

export function PsiReportBuilderPage({ mode = 'report' }: { mode?: 'report' | 'export' }) {
  return (
    <div className="space-y-5">
      <PsiReportsHeader />
      <PsiReportBuilderForm mode={mode} />
    </div>
  );
}

export function PsiReportBuilderForm({ mode = 'report', unitId, equipmentId }: { mode?: 'report' | 'export'; unitId?: string; equipmentId?: string }) {
  const router = useRouter();
  const { lookups, generate, createExport } = usePsiReportBuilder();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({
    reportType: 'PSI Executive Summary',
    reportCategory: 'Management',
    scopeType: unitId ? 'Unit' : equipmentId ? 'Equipment' : 'Site',
    unitId,
    equipmentId,
    moduleKeys: ['units', 'completeness', 'review-approval', 'documents', 'integrations'],
    sections: ['Executive Summary', 'PSI Completeness', 'Critical Gaps', 'Document Evidence', 'Approval Snapshot'],
    includeDocuments: mode === 'export',
    includeHistory: true,
    includeApprovals: true,
    outputFormat: mode === 'export' ? 'ZIP' : 'PDF',
    redactionMode: 'Permission based'
  });
  const reportTypes = lookups.reportTypes.data ?? [];
  const formats = lookups.formats.data ?? [];
  const sections = lookups.sections.data ?? [];
  const packageTypes = lookups.packageTypes.data ?? [];
  const disabledReason = validationReason(form, step, mode);
  const submit = async () => {
    const result = mode === 'export' ? await createExport.mutateAsync(form) : await generate.mutateAsync({ ...form, reportName: form.reportName ?? form.reportType });
    const id = (result as any).id;
    router.push(mode === 'export' ? `/process-safety-information/reports/export/jobs/${id}` : `/process-safety-information/reports/generated/${id}`);
  };
  return (
    <PsiCard title={mode === 'export' ? 'Export Package Builder' : 'Report Section Builder / Checklist'} subtitle="Complete the PDF-required builder steps. Data is collected by the backend from real PSI modules, evidence, approvals, and linked documents.">
      <div className="mb-4 grid gap-2 md:grid-cols-6">{['Report Type', 'Scope', 'Modules / Sections', 'Evidence / Documents', 'Output Format', 'Review & Generate'].map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-lg border p-2 text-xs font-semibold ${step === index ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>)}</div>
      {step === 0 ? <ReportTypeStep form={form} setForm={setForm} reportTypes={mode === 'export' ? packageTypes : reportTypes} mode={mode} /> : null}
      {step === 1 ? <ReportScopeStep form={form} setForm={setForm} /> : null}
      {step === 2 ? <ReportSectionsStep form={form} setForm={setForm} sections={sections} /> : null}
      {step === 3 ? <ReportEvidenceDocumentsStep form={form} setForm={setForm} /> : null}
      {step === 4 ? <ReportOutputFormatStep form={form} setForm={setForm} formats={formats} /> : null}
      {step === 5 ? <ReportReviewGenerateStep form={form} mode={mode} isPending={generate.isPending || createExport.isPending} /> : null}
      {(generate.error || createExport.error) ? <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{(generate.error ?? createExport.error)?.message}</div> : null}
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <PsiButton variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} title={step === 0 ? 'Already on the first step.' : undefined}>Back</PsiButton>
        <div className="flex gap-2">
          <PsiButton variant="secondary" href="/process-safety-information/reports">Cancel</PsiButton>
          {step < 5 ? <PsiButton onClick={() => setStep(step + 1)} disabled={Boolean(disabledReason)} title={disabledReason ?? undefined}>Next</PsiButton> : <PsiButton onClick={() => void submit()} disabled={Boolean(disabledReason) || generate.isPending || createExport.isPending} title={disabledReason ?? undefined}>{mode === 'export' ? 'Generate Package' : 'Generate Report'}</PsiButton>}
        </div>
      </div>
    </PsiCard>
  );
}

export function ReportTypeStep({ form, setForm, reportTypes, mode }: StepProps & { reportTypes: string[]; mode?: string }) {
  return <StepShell title={mode === 'export' ? 'Export package type' : 'Report type'}><SelectField label={mode === 'export' ? 'Package type' : 'Report type'} value={mode === 'export' ? form.packageType : form.reportType} options={reportTypes} onChange={(value) => setForm({ ...form, [mode === 'export' ? 'packageType' : 'reportType']: value })} /><TextField label="Report/export name" value={form.reportName ?? form.exportName ?? ''} onChange={(value) => setForm({ ...form, [mode === 'export' ? 'exportName' : 'reportName']: value })} /></StepShell>;
}

export function ReportScopeStep({ form, setForm }: StepProps) {
  return <StepShell title="Scope"><SelectField label="Scope type" value={form.scopeType} options={scopeTypes} onChange={(value) => setForm({ ...form, scopeType: value })} /><TextField label="Unit ID" value={form.unitId ?? ''} onChange={(value) => setForm({ ...form, unitId: value })} /><TextField label="Equipment ID" value={form.equipmentId ?? ''} onChange={(value) => setForm({ ...form, equipmentId: value })} /><TextField label="Module key" value={form.moduleKey ?? ''} onChange={(value) => setForm({ ...form, moduleKey: value })} /></StepShell>;
}

export function ReportSectionsStep({ form, setForm, sections }: StepProps & { sections: string[] }) {
  return <StepShell title="Modules and report sections"><CheckboxGroup label="PSI modules" values={form.moduleKeys ?? []} options={moduleKeys} onChange={(values) => setForm({ ...form, moduleKeys: values })} /><CheckboxGroup label="Sections" values={form.sections ?? []} options={sections} onChange={(values) => setForm({ ...form, sections: values })} /></StepShell>;
}

export function ReportEvidenceDocumentsStep({ form, setForm }: StepProps) {
  return <StepShell title="Evidence / Documents"><Toggle label="Include linked controlled documents" checked={Boolean(form.includeDocuments)} onChange={(checked) => setForm({ ...form, includeDocuments: checked })} /><Toggle label="Include approval and e-sign snapshots" checked={Boolean(form.includeApprovals)} onChange={(checked) => setForm({ ...form, includeApprovals: checked })} /><Toggle label="Include PSI history / audit trail" checked={Boolean(form.includeHistory)} onChange={(checked) => setForm({ ...form, includeHistory: checked })} /><SelectField label="Redaction mode" value={form.redactionMode} options={['Permission based', 'Redacted', 'Metadata only']} onChange={(value) => setForm({ ...form, redactionMode: value })} /></StepShell>;
}

export function ReportOutputFormatStep({ form, setForm, formats }: StepProps & { formats: string[] }) {
  return <StepShell title="Output format"><SelectField label="Output format" value={form.outputFormat} options={formats} onChange={(value) => setForm({ ...form, outputFormat: value })} /><Toggle label="Include package manifest" checked={form.includeManifest !== false} onChange={(checked) => setForm({ ...form, includeManifest: checked })} /></StepShell>;
}

export function ReportReviewGenerateStep({ form, mode, isPending }: { form: Record<string, any>; mode?: string; isPending?: boolean }) {
  return (
    <StepShell title="Review & Generate">
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(form).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{labelize(key)}</p><p className="mt-1 text-sm">{Array.isArray(value) ? value.join(', ') : String(value)}</p></div>)}
      </div>
      <p className="mt-4 text-sm text-[var(--psm-muted)]">{isPending ? 'Generating from backend PSI data...' : mode === 'export' ? 'Package generation will create export job, package manifest, file metadata, audit log, and PSI report history.' : 'Report generation will snapshot current PSI module data, approvals, documents, integrations, and warnings.'}</p>
    </StepShell>
  );
}

export function PsiReportTemplateRegistryPage() {
  const query = usePsiReportTemplates({ page: 1, limit: 50 });
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load report templates.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><TemplatesTable rows={query.data?.rows ?? []} /></div>;
}

export function PsiReportTemplateFormPage({ templateId }: { templateId?: string | undefined }) {
  const router = useRouter();
  const detail = usePsiReportTemplate(templateId);
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: (data: Record<string, unknown>) => templateId ? psiReportService.updateTemplate(templateId, data) : psiReportService.createTemplate(data), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['psi', 'reports'] }); router.push('/process-safety-information/reports/templates'); } });
  if (templateId && detail.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiReportTemplateForm initial={detail.data} onSubmit={(data) => save.mutate(data)} isSaving={save.isPending} error={save.error?.message} /></div>;
}

export function PsiReportTemplateForm({ initial, onSubmit, isSaving, error }: { initial?: PsiReportTemplate | undefined; onSubmit: (data: Record<string, unknown>) => void; isSaving?: boolean | undefined; error?: string | undefined }) {
  const [form, setForm] = useState<Record<string, any>>(initial ?? { template_name: '', template_type: 'PSI Executive Summary', report_category: 'Management', scope_type: 'Site', default_format: 'PDF', include_documents: false, module_keys: ['units', 'completeness'] });
  return (
    <PsiCard title="Report Template Form" subtitle="Templates define reusable report type, scope, modules, evidence and output defaults.">
      <StepShell title="Template details">
        <TextField label="Template name" value={form.template_name ?? form.templateName ?? ''} onChange={(value) => setForm({ ...form, templateName: value })} />
        <TextField label="Report type" value={form.template_type ?? form.templateType ?? ''} onChange={(value) => setForm({ ...form, templateType: value })} />
        <SelectField label="Category" value={form.report_category ?? form.reportCategory ?? 'Management'} options={['Management', 'Audit / Compliance', 'Engineering', 'Module Specific']} onChange={(value) => setForm({ ...form, reportCategory: value })} />
        <SelectField label="Scope" value={form.scope_type ?? form.scopeType ?? 'Site'} options={scopeTypes} onChange={(value) => setForm({ ...form, scopeType: value })} />
        <CheckboxGroup label="Default modules" values={form.module_keys ?? form.moduleKeys ?? []} options={moduleKeys} onChange={(values) => setForm({ ...form, moduleKeys: values })} />
        <Toggle label="Include controlled documents by default" checked={Boolean(form.include_documents ?? form.includeDocuments)} onChange={(checked) => setForm({ ...form, includeDocuments: checked })} />
      </StepShell>
      {error ? <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
      <div className="mt-5 flex justify-end gap-2"><PsiButton variant="secondary" href="/process-safety-information/reports/templates">Cancel</PsiButton><PsiButton onClick={() => onSubmit(form)} disabled={isSaving || !String(form.templateName ?? form.template_name ?? '').trim()} title={!String(form.templateName ?? form.template_name ?? '').trim() ? 'Template name is required.' : undefined}>{isSaving ? 'Saving...' : 'Save Template'}</PsiButton></div>
    </PsiCard>
  );
}

export function PsiGeneratedReportsPage() {
  const query = usePsiGeneratedReports({ page: 1, limit: 50 });
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load generated reports.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><GeneratedReportsTable rows={query.data?.rows ?? []} /></div>;
}

export function PsiGeneratedReportDetailPage({ reportId }: { reportId: string }) {
  const detail = usePsiReportDetail(reportId);
  if (detail.isLoading) return <PsiLoadingState rows={6} />;
  if (detail.isError) return <PsiErrorState message={detail.error?.message ?? 'Failed to load report detail.'} onRetry={() => void detail.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><ReportDetailDrawer detail={detail.data} /><PsiReportFilesPanel files={detail.data?.files ?? []} /><PsiReportWarningsPanel report={detail.data?.report} /><HistoryPanel rows={detail.data?.history ?? []} /></div>;
}

export function PsiReportPreview({ reportId }: { reportId: string }) {
  const preview = usePsiReportPreview(reportId);
  if (preview.isLoading) return <PsiLoadingState rows={5} />;
  return <PsiCard title="Report Preview Panel" subtitle="Backend-generated preview from the saved source snapshot."><pre className="max-h-[70vh] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(preview.data ?? {}, null, 2)}</pre></PsiCard>;
}

export function PsiExportJobsPage() {
  const query = usePsiExportJobs({ page: 1, limit: 50 });
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load export jobs.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><ExportJobsTable rows={query.data?.rows ?? []} /></div>;
}

export function PsiExportJobDetailPage({ jobId }: { jobId: string }) {
  const query = usePsiExportJob(jobId);
  if (query.isLoading) return <PsiLoadingState rows={5} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load export job.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiExportProgressPanel job={query.data?.job} /><PsiReportFilesPanel files={query.data?.files ?? []} />{query.data?.package ? <PsiPackageManifestViewer manifest={(query.data.package as any).package?.manifest_json} /> : null}</div>;
}

export function PsiExportPackagesPage() {
  const query = usePsiExportPackages({ page: 1, limit: 50 });
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load export packages.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><ExportPackagesTable rows={query.data?.rows ?? []} /></div>;
}

export function PsiExportPackageDetailPage({ packageId }: { packageId: string }) {
  const query = usePsiExportPackage(packageId);
  if (query.isLoading) return <PsiLoadingState rows={5} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load export package.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiPackageManifestViewer manifest={query.data?.package?.manifest_json} /><PsiPackageItemsTable rows={query.data?.items ?? []} /><PsiReportFilesPanel files={query.data?.files ?? []} /><HistoryPanel rows={query.data?.history ?? []} /></div>;
}

export function PsiScheduledReportsPage() {
  const query = usePsiScheduledReports({ page: 1, limit: 50 });
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message={query.error?.message ?? 'Failed to load scheduled reports.'} onRetry={() => void query.refetch()} />;
  return <div className="space-y-5"><PsiReportsHeader /><ScheduledReportsTable rows={query.data?.rows ?? []} /></div>;
}

export function PsiScheduledReportFormPage({ scheduleId }: { scheduleId?: string | undefined }) {
  const router = useRouter();
  const detail = usePsiScheduledReport(scheduleId);
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: (data: Record<string, unknown>) => scheduleId ? psiReportService.updateSchedule(scheduleId, data) : psiReportService.createSchedule(data), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['psi', 'reports'] }); router.push('/process-safety-information/reports/scheduled'); } });
  if (scheduleId && detail.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiScheduledReportForm initial={detail.data} onSubmit={(data) => save.mutate(data)} isSaving={save.isPending} error={save.error?.message} /></div>;
}

export function PsiScheduledReportForm({ initial, onSubmit, isSaving, error }: { initial?: PsiScheduledReport | undefined; onSubmit: (data: Record<string, unknown>) => void; isSaving?: boolean | undefined; error?: string | undefined }) {
  const [form, setForm] = useState<Record<string, any>>(initial ?? { scheduleName: '', reportType: 'PSI Executive Summary', frequency: 'Monthly', outputFormat: 'PDF', scopeType: 'Site', enabled: true });
  return <PsiCard title="Scheduled Report Form" subtitle="Use Notification Center/recipients when configured; backend stores schedule metadata and run history."><StepShell title="Schedule details"><TextField label="Schedule name" value={form.scheduleName ?? form.schedule_name ?? ''} onChange={(value) => setForm({ ...form, scheduleName: value })} /><TextField label="Report type" value={form.reportType ?? form.report_type ?? ''} onChange={(value) => setForm({ ...form, reportType: value })} /><SelectField label="Frequency" value={form.frequency ?? 'Monthly'} options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semiannual', 'Annual', 'On Demand']} onChange={(value) => setForm({ ...form, frequency: value })} /><SelectField label="Output format" value={form.outputFormat ?? form.output_format ?? 'PDF'} options={['PDF', 'XLSX', 'CSV', 'ZIP']} onChange={(value) => setForm({ ...form, outputFormat: value })} /><TextField label="Next run at" value={form.nextRunAt ?? form.next_run_at ?? ''} onChange={(value) => setForm({ ...form, nextRunAt: value })} /><Toggle label="Enabled" checked={form.enabled !== false} onChange={(checked) => setForm({ ...form, enabled: checked })} /></StepShell>{error ? <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}<div className="mt-5 flex justify-end gap-2"><PsiButton variant="secondary" href="/process-safety-information/reports/scheduled">Cancel</PsiButton><PsiButton onClick={() => onSubmit(form)} disabled={isSaving || !String(form.scheduleName ?? form.schedule_name ?? '').trim()} title={!String(form.scheduleName ?? form.schedule_name ?? '').trim() ? 'Schedule name is required.' : undefined}>{isSaving ? 'Saving...' : 'Save Schedule'}</PsiButton></div></PsiCard>;
}

export function PsiReportsSettingsPage() {
  const query = usePsiReportSettings();
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: (data: Record<string, unknown>) => psiReportService.updateSettings(data), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['psi', 'reports', 'settings'] }) });
  const [draft, setDraft] = useState<Record<string, any>>({});
  const form = { ...(query.data ?? {}), ...draft };
  if (query.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiCard title="Report Settings" subtitle="Backend-enforced defaults for redaction, document export, retention, official snapshot requirements, and schedule timezone."><StepShell title="Settings"><SelectField label="Default format" value={String(form.default_format ?? 'PDF')} options={['PDF', 'XLSX', 'CSV', 'ZIP']} onChange={(value) => setDraft({ ...draft, defaultFormat: value })} /><SelectField label="Default redaction mode" value={String(form.default_redaction_mode ?? 'Permission based')} options={['Permission based', 'Redacted', 'Metadata only']} onChange={(value) => setDraft({ ...draft, defaultRedactionMode: value })} /><Toggle label="Allow document exports" checked={form.allow_document_exports !== false} onChange={(checked) => setDraft({ ...draft, allowDocumentExports: checked })} /><Toggle label="Require approval snapshot for official reports" checked={form.require_approval_snapshot_for_official !== false} onChange={(checked) => setDraft({ ...draft, requireApprovalSnapshotForOfficial: checked })} /><TextField label="Max export size MB" value={String(form.max_export_size_mb ?? 500)} onChange={(value) => setDraft({ ...draft, maxExportSizeMb: Number(value) })} /><TextField label="Retention days" value={String(form.retention_days ?? 2555)} onChange={(value) => setDraft({ ...draft, retentionDays: Number(value) })} /></StepShell><div className="mt-5 flex justify-end"><PsiButton onClick={() => save.mutate(draft)} disabled={save.isPending || !Object.keys(draft).length} title={!Object.keys(draft).length ? 'No settings have changed.' : undefined}>{save.isPending ? 'Saving...' : 'Save Settings'}</PsiButton></div></PsiCard></div>;
}

export function UnitPsiReportsPage() {
  const params = useParams<{ unitId: string }>();
  const query = useQuery({ queryKey: ['psi', 'reports', 'unit', params.unitId], queryFn: () => psiReportService.unitReports(params.unitId) });
  if (query.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiReportBuilderForm unitId={params.unitId} /><GeneratedReportsTable rows={query.data?.rows ?? []} /></div>;
}

export function EquipmentPsiReportsPage() {
  const params = useParams<{ equipmentId: string }>();
  const query = useQuery({ queryKey: ['psi', 'reports', 'equipment', params.equipmentId], queryFn: () => psiReportService.equipmentReports(params.equipmentId) });
  if (query.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiReportBuilderForm equipmentId={params.equipmentId} /><GeneratedReportsTable rows={query.data?.rows ?? []} /></div>;
}

export function ModulePsiReportsPage({ moduleKey }: { moduleKey: string }) {
  const query = useQuery({ queryKey: ['psi', 'reports', 'module', moduleKey], queryFn: () => psiReportService.moduleReports(moduleKey) });
  if (query.isLoading) return <PsiLoadingState rows={4} />;
  return <div className="space-y-5"><PsiReportsHeader /><PsiCard title={`${labelize(moduleKey)} Reports`} subtitle="Module-specific templates, generated reports, and export routes use the central PSI report backend."><pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data ?? {}, null, 2)}</pre></PsiCard></div>;
}

function AttentionPanel({ rows }: { rows: { label: string; value: number; tone?: string }[] }) {
  return <PsiCard title="Report Readiness / Blockers Panel" subtitle="Aggregated from report jobs, scheduled reports, and export state."><div className="space-y-3">{rows.map((row) => <div key={row.label} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><span className="text-sm">{row.label}</span><span className={`text-lg font-bold ${row.tone === 'danger' ? 'text-danger' : row.tone === 'warn' ? 'text-warning' : 'text-success'}`}>{row.value}</span></div>)}</div></PsiCard>;
}

function TemplateMiniPanel({ rows }: { rows: PsiReportTemplate[] }) {
  return <PsiCard title="Report Template Selection Panel" action={<PsiButton href="/process-safety-information/reports/templates" variant="secondary">View all</PsiButton>}>{rows.length ? <div className="space-y-2">{rows.map((row) => <Link key={row.id} href={`/process-safety-information/reports/templates/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]"><div className="flex justify-between gap-3"><span className="font-semibold">{row.template_name}</span><ReportTypeBadge type={row.report_category} /></div><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.template_type}</p></Link>)}</div> : <PsiEmptyState title="No templates" message="No PSI report templates are available in the selected scope." />}</PsiCard>;
}

function ScheduledMiniPanel({ rows }: { rows: PsiScheduledReport[] }) {
  return <PsiCard title="Scheduled Reports Due Soon" action={<PsiButton href="/process-safety-information/reports/scheduled" variant="secondary">Schedules</PsiButton>}>{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-2"><span className="font-semibold">{row.schedule_name}</span><ReportStatusBadge status={row.status} /></div><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.frequency} - next {formatDate(row.next_run_at)}</p></div>)}</div> : <PsiEmptyState title="No schedules" message="No scheduled PSI reports have been configured." />}</PsiCard>;
}

function GeneratedReportsTable({ rows, className }: { rows: PsiGeneratedReport[]; className?: string | undefined }) {
  return <PsiCard title="Generated Reports Register" subtitle="Generated reports use saved backend snapshots and file metadata." action={<PsiButton href="/process-safety-information/reports/generated" variant="secondary">Open register</PsiButton>}><Table className={className} columns={['Report', 'Type', 'Scope', 'Status', 'Format', 'Warnings', 'Generated']} rows={rows} empty="No generated reports found." render={(row) => [<Link key="r" className="font-semibold text-primary" href={`/process-safety-information/reports/generated/${row.id}`}>{row.report_number}<br /><span className="text-[var(--psm-fg)]">{row.report_name}</span></Link>, <ReportTypeBadge key="t" type={row.report_type} />, row.scope_type, <ReportStatusBadge key="s" status={row.status} />, <ExportFormatBadge key="f" format={row.format} />, <GeneratedWithWarningsBadge key="w" warnings={row.warnings_json?.length ?? row.generated_with_warnings} />, formatDate(row.generated_at)]} /></PsiCard>;
}

function ExportJobsTable({ rows, className }: { rows: PsiExportJob[]; className?: string | undefined }) {
  return <PsiCard title="Export Jobs" subtitle="Package/export generation status and progress."><Table className={className} columns={['Job', 'Package', 'Status', 'Progress', 'Format', 'Requested']} rows={rows} empty="No export jobs found." render={(row) => [<Link key="j" className="font-semibold text-primary" href={`/process-safety-information/reports/export/jobs/${row.id}`}>{row.export_number}<br /><span className="text-[var(--psm-fg)]">{row.export_name}</span></Link>, <PackageTypeBadge key="p" type={row.package_type} />, <ExportStatusBadge key="s" status={row.status} />, <div key="pr" className="min-w-28"><PsiProgress value={row.progress_percent ?? 0} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.progress_percent ?? 0}%</p></div>, <ExportFormatBadge key="f" format={row.output_format} />, formatDate(row.requested_at)]} /></PsiCard>;
}

function ExportPackagesTable({ rows }: { rows: PsiExportPackage[] }) {
  return <PsiCard title="Report Package Builder / Packages" subtitle="Generated packages include manifests, item lists, document snapshots and redaction state."><Table columns={['Package', 'Type', 'Status', 'Files', 'Documents', 'Generated']} rows={rows} empty="No export packages found." render={(row) => [<Link key="p" className="font-semibold text-primary" href={`/process-safety-information/reports/export/packages/${row.id}`}>{row.package_number}<br /><span className="text-[var(--psm-fg)]">{row.package_name}</span></Link>, <PackageTypeBadge key="t" type={row.package_type} />, <ExportStatusBadge key="s" status={row.status} />, row.file_count ?? 0, row.document_count ?? 0, formatDate(row.generated_at)]} /></PsiCard>;
}

function TemplatesTable({ rows }: { rows: PsiReportTemplate[] }) {
  return <PsiCard title="Report Templates" subtitle="Reusable report, export, evidence and output presets." action={<PsiButton href="/process-safety-information/reports/templates/new">New Template</PsiButton>}><Table columns={['Template', 'Type', 'Category', 'Scope', 'Documents', 'Format']} rows={rows} empty="No templates found." render={(row) => [<Link key="n" className="font-semibold text-primary" href={`/process-safety-information/reports/templates/${row.id}/edit`}>{row.template_name}</Link>, row.template_type, <ReportTypeBadge key="c" type={row.report_category} />, row.scope_type, row.include_documents ? <DocumentIncludedBadge key="d" /> : <DocumentExcludedBadge key="d" />, <ExportFormatBadge key="f" format={row.default_format} />]} /></PsiCard>;
}

function ScheduledReportsTable({ rows }: { rows: PsiScheduledReport[] }) {
  return <PsiCard title="Scheduled Reports Register" action={<PsiButton href="/process-safety-information/reports/scheduled/new">New Schedule</PsiButton>}><Table columns={['Schedule', 'Type', 'Frequency', 'Status', 'Next Run', 'Last Run']} rows={rows} empty="No scheduled reports found." render={(row) => [<Link key="s" className="font-semibold text-primary" href={`/process-safety-information/reports/scheduled/${row.id}`}>{row.schedule_name}</Link>, row.report_type, row.frequency, <ReportStatusBadge key="st" status={row.status} />, formatDate(row.next_run_at), formatDate(row.last_run_at)]} /></PsiCard>;
}

export function PsiReportFilesPanel({ files }: { files: PsiReportFile[] }) {
  return <PsiCard title="Report Files Panel" subtitle="Files are metadata records backed by secure storage; raw private URLs are never rendered."><Table columns={['File', 'Type', 'Format', 'Classification', 'Downloads']} rows={files} empty="No report files are available." render={(row) => [row.file_name, row.file_type, <ExportFormatBadge key="f" format={row.file_format} />, row.classification ?? 'Internal', row.download_count ?? 0]} /></PsiCard>;
}

export function PsiReportWarningsPanel({ report }: { report?: PsiGeneratedReport | undefined }) {
  const warnings = report?.warnings_json ?? [];
  return <PsiCard title="Report Warnings / Redaction Preview" subtitle="Warnings come from backend snapshot checks for completeness, approvals, documents and integrations.">{warnings.length ? <div className="space-y-2">{warnings.map((warning, index) => <div key={index} className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{String((warning as any).category ?? 'Warning')}: {String((warning as any).message ?? JSON.stringify(warning))}</div>)}</div> : <PsiEmptyState title="No warnings" message="This generated report did not return backend warnings." />}</PsiCard>;
}

export function PsiExportProgressPanel({ job }: { job?: PsiExportJob | undefined }) {
  return <PsiCard title="Export Progress Panel" subtitle="Status is controlled by backend export job state."><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">{job?.export_name ?? 'Export job'}</h2><p className="text-sm text-[var(--psm-muted)]">{job?.export_number}</p></div><ExportStatusBadge status={job?.status} /></div><div className="mt-4"><PsiProgress value={job?.progress_percent ?? 0} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{job?.progress_percent ?? 0}% complete</p></PsiCard>;
}

export function PsiPackageManifestViewer({ manifest }: { manifest?: Record<string, unknown> | undefined }) {
  return <PsiCard title="Package Manifest Viewer" subtitle="Manifest is generated by backend from the export source snapshot."><pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(manifest ?? {}, null, 2)}</pre></PsiCard>;
}

export function PsiPackageItemsTable({ rows }: { rows: any[] }) {
  return <PsiCard title="Package Items Table" subtitle="Each item records source module, record, inclusion, redaction and exclusion reason."><Table columns={['Item', 'Module', 'Record', 'Included', 'Redacted']} rows={rows} empty="No package items found." render={(row) => [row.title, row.source_module ?? row.item_type, row.source_record_number ?? row.source_record_id ?? '-', row.included ? 'Yes' : 'No', row.redacted ? 'Yes' : 'No']} /></PsiCard>;
}

function ReportDetailDrawer({ detail }: { detail?: any }) {
  const report = detail?.report;
  if (!report) return <PsiEmptyState title="Report not found" message="The generated report detail was not returned." />;
  return <PsiCard title="Report Detail Drawer" subtitle="Official generated report metadata, snapshots and secure file references."><div className="grid gap-3 md:grid-cols-3"><Info label="Report" value={`${report.report_number} - ${report.report_name}`} /><Info label="Type" value={report.report_type} /><Info label="Status" value={<ReportStatusBadge status={report.status} />} /><Info label="Scope" value={report.scope_type} /><Info label="Format" value={<ExportFormatBadge format={report.format} />} /><Info label="Documents" value={report.document_inclusion_status} /></div></PsiCard>;
}

function HistoryPanel({ rows, className }: { rows: any[]; className?: string | undefined }) {
  return <PsiCard title="Export History Panel" subtitle="Immutable PSI report/export history backed by audit/history records."><Table className={className} columns={['Event', 'Record', 'Actor', 'Date']} rows={rows} empty="No report history events found." render={(row) => [<span key="e" className="font-semibold">{row.event_title}<br /><span className="text-xs font-normal text-[var(--psm-muted)]">{row.event_type}</span></span>, row.related_record_type, row.actor_user_id ?? 'System', formatDate(row.created_at)]} /></PsiCard>;
}

type StepProps = { form: Record<string, any>; setForm: (value: Record<string, any>) => void };

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm"><span className="font-semibold">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-[var(--psm-fg)] outline-none focus:border-primary" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
  const safeOptions = options.length ? options : [value ?? 'Not configured'];
  return <label className="grid gap-1 text-sm"><span className="font-semibold">{label}</span><select value={value ?? safeOptions[0]} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-[var(--psm-fg)] outline-none focus:border-primary">{safeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function CheckboxGroup({ label, values, options, onChange }: { label: string; values: string[]; options: string[]; onChange: (value: string[]) => void }) {
  const selected = new Set(values);
  return <div className="md:col-span-2"><p className="mb-2 text-sm font-semibold">{label}</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option) => <label key={option} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><input type="checkbox" checked={selected.has(option)} onChange={(event) => { const next = new Set(selected); if (event.target.checked) next.add(option); else next.delete(option); onChange([...next]); }} />{option}</label>)}</div></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><span className="font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function Table<T>({ columns, rows, render, empty, className }: { columns: string[]; rows: T[]; render: (row: T) => React.ReactNode[]; empty: string; className?: string | undefined }) {
  if (!rows.length) return <div className={className}><PsiEmptyState title="Empty" message={empty} /></div>;
  return <div className={`overflow-x-auto ${className ?? ''}`}><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{columns.map((column) => <th key={column} className="border-b border-[var(--psm-line)] px-3 py-2">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String((row as any).id ?? index)} className="border-b border-[var(--psm-line)] align-top">{render(row).map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}

function validationReason(form: Record<string, any>, step: number, mode: string) {
  if (step === 0 && mode === 'report' && !form.reportType) return 'Report type is required.';
  if (step === 0 && mode === 'export' && !form.packageType) return 'Export package type is required.';
  if (step === 1 && form.scopeType === 'Unit' && !form.unitId) return 'Unit scope requires a unit ID.';
  if (step === 1 && form.scopeType === 'Equipment' && !form.equipmentId) return 'Equipment scope requires an equipment ID.';
  if (step === 2 && !form.moduleKeys?.length) return 'Select at least one PSI module.';
  if (step === 4 && !form.outputFormat) return 'Output format is required.';
  return null;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function labelize(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
