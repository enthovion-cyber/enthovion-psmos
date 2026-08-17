'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TrainingBadge, TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState, TrainingMetricCard, TrainingProgress } from '../shared/TrainingUi';
import { useTrainingReportLookups, useTrainingReportMutations } from '../hooks/useTrainingReports';
import type { TrainingReportList, TrainingReportRow, TrainingReportsDashboard } from '../types/training-reports.types';

export const value = (row: TrainingReportRow, keys: string[], fallback = 'Not recorded') => keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== '') ?? fallback;
export const dateValue = (input: unknown) => input ? new Date(String(input)).toLocaleString() : 'Not recorded';

export function TrainingReportsLayout({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Training & Competency</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function TrainingReportStatusBadge({ status }: { status?: string | undefined }) {
  const text = status ?? 'Unknown';
  const tone = /failed|deleted|denied/i.test(text) ? 'danger' : /warning|queued|running|restricted|expired/i.test(text) ? 'warn' : /generated|completed|active|allowed/i.test(text) ? 'good' : 'neutral';
  return <TrainingBadge tone={tone}>{text}</TrainingBadge>;
}
export function TrainingExportJobStatusBadge({ status }: { status?: string | undefined }) { return <TrainingReportStatusBadge status={status} />; }
export function TrainingReportFormatBadge({ format }: { format?: string | undefined }) { return <TrainingBadge tone="info">{format ?? 'Format missing'}</TrainingBadge>; }
export function TrainingPackageTypeBadge({ type }: { type?: string | undefined }) { return <TrainingBadge>{type ?? 'Package type missing'}</TrainingBadge>; }
export function ConfidentialityBadge({ level }: { level?: string | undefined }) {
  const tone = level === 'Restricted' ? 'danger' : level === 'Confidential' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{level ?? 'Internal'}</TrainingBadge>;
}
export function ReportDownloadStatusBadge({ allowed }: { allowed?: boolean | undefined }) { return <TrainingBadge tone={allowed ? 'good' : 'danger'}>{allowed ? 'Allowed' : 'Blocked'}</TrainingBadge>; }
export function ReportEvidencePackageBadge({ type }: { type?: string | undefined }) { return <TrainingBadge tone="info">{type ?? 'Evidence Package'}</TrainingBadge>; }

export function TrainingReportsSummaryCards({ data }: { data: TrainingReportsDashboard | undefined }) {
  const summary = data?.summary ?? {};
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TrainingMetricCard label="Generated reports" value={summary.generatedReports ?? 0} href="/training-competency/reports/generated" />
      <TrainingMetricCard label="Failed export jobs" value={summary.failedExportJobs ?? 0} href="/training-competency/reports/export/jobs" tone={summary.failedExportJobs ? 'danger' : 'good'} />
      <TrainingMetricCard label="Evidence packages" value={summary.evidencePackages ?? 0} href="/training-competency/reports/packages" />
      <TrainingMetricCard label="Downloads tracked" value={summary.downloadsTracked ?? 0} href="/training-competency/reports/downloads" />
      <TrainingMetricCard label="Scheduled reports" value={summary.scheduledReports ?? 0} href="/training-competency/reports/scheduled" />
      <TrainingMetricCard label="Restricted exports" value={summary.restrictedExports ?? data?.restrictedDataExports?.length ?? 0} tone={(summary.restrictedExports ?? 0) > 0 ? 'warn' : 'neutral'} />
      <TrainingMetricCard label="Templates active" value={summary.activeTemplates ?? data?.templatesPreview?.length ?? 0} href="/training-competency/reports/templates" />
      <TrainingMetricCard label="Last updated" value={data?.header?.lastUpdated ? new Date(data.header.lastUpdated).toLocaleDateString() : 'Now'} />
    </div>
  );
}

export function TrainingReportsFilters({ action }: { action?: React.ReactNode }) {
  return (
    <TrainingCard title="Filters / Search" subtitle="Server-side filters are sent to the backend report APIs for site, unit, area, source module, status, format and date scopes." action={action}>
      <div className="grid gap-3 md:grid-cols-4">
        {['Search', 'Site / unit / area', 'Report type', 'Status'].map((label) => <input key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder={label} disabled title="Connect this field to query params for interactive saved views." />)}
      </div>
    </TrainingCard>
  );
}

export function TrainingReportsCharts({ data }: { data: TrainingReportsDashboard | undefined }) {
  const modules = Object.entries(data?.reportsByModule ?? {});
  const formats = Object.entries(data?.reportsByFormat ?? {});
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Breakdown title="Reports By Module" rows={modules} />
      <Breakdown title="Reports By Format" rows={formats} />
      <TrainingCard title="Export Health" subtitle="Derived from export jobs and generated report status.">
        <TrainingProgress value={Number(data?.summary?.successfulExportPercent ?? 0)} />
        <p className="mt-3 text-sm text-[var(--psm-muted)]">{data?.summary?.successfulExportPercent ?? 0}% completed without failures.</p>
      </TrainingCard>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return <TrainingCard title={title}>{rows.length ? <div className="space-y-3">{rows.map(([label, count]) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label || 'Unscoped'}</span><span className="font-semibold">{count}</span></div><TrainingProgress value={count ? Math.min(100, count * 10) : 0} /></div>)}</div> : <TrainingEmptyState title="No data" message="No backend report activity exists for this scope yet." />}</TrainingCard>;
}

export const generatedColumns = [
  { key: 'report_code', label: 'Report #' },
  { key: 'report_title', label: 'Title' },
  { key: 'report_type', label: 'Report Type' },
  { key: 'source_module', label: 'Source' },
  { key: 'export_format', label: 'Format', render: (row: TrainingReportRow) => <TrainingReportFormatBadge format={row.export_format} /> },
  { key: 'report_status', label: 'Status', render: (row: TrainingReportRow) => <TrainingReportStatusBadge status={row.report_status} /> },
  { key: 'confidentiality_level', label: 'Classification', render: (row: TrainingReportRow) => <ConfidentialityBadge level={row.confidentiality_level} /> },
  { key: 'generated_at', label: 'Generated At', render: (row: TrainingReportRow) => dateValue(row.generated_at) }
];
export const templateColumns = [
  { key: 'template_code', label: 'Code' },
  { key: 'template_name', label: 'Template' },
  { key: 'report_type', label: 'Type' },
  { key: 'source_module', label: 'Source' },
  { key: 'default_format', label: 'Default Format', render: (row: TrainingReportRow) => <TrainingReportFormatBadge format={row.default_format} /> },
  { key: 'template_status', label: 'Status', render: (row: TrainingReportRow) => <TrainingReportStatusBadge status={row.template_status} /> },
  { key: 'confidentiality_level', label: 'Classification', render: (row: TrainingReportRow) => <ConfidentialityBadge level={row.confidentiality_level} /> }
];
export const jobColumns = [
  { key: 'job_number', label: 'Job #' },
  { key: 'job_type', label: 'Type' },
  { key: 'export_format', label: 'Format', render: (row: TrainingReportRow) => <TrainingReportFormatBadge format={row.export_format} /> },
  { key: 'job_status', label: 'Status', render: (row: TrainingReportRow) => <TrainingExportJobStatusBadge status={row.job_status} /> },
  { key: 'queued_at', label: 'Queued', render: (row: TrainingReportRow) => dateValue(row.queued_at) },
  { key: 'completed_at', label: 'Completed', render: (row: TrainingReportRow) => dateValue(row.completed_at) }
];
export const packageColumns = [
  { key: 'package_number', label: 'Package #' },
  { key: 'package_title', label: 'Title' },
  { key: 'package_type', label: 'Type', render: (row: TrainingReportRow) => <TrainingPackageTypeBadge type={row.package_type} /> },
  { key: 'package_status', label: 'Status', render: (row: TrainingReportRow) => <TrainingReportStatusBadge status={row.package_status} /> },
  { key: 'manifest_json', label: 'Manifest', render: (row: TrainingReportRow) => `${row.manifest_json?.itemCount ?? 0} items` }
];
export const scheduledColumns = [
  { key: 'schedule_title', label: 'Schedule' },
  { key: 'report_type', label: 'Report Type' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'export_format', label: 'Format', render: (row: TrainingReportRow) => <TrainingReportFormatBadge format={row.export_format} /> },
  { key: 'status', label: 'Status', render: (row: TrainingReportRow) => <TrainingReportStatusBadge status={row.status} /> },
  { key: 'next_run_at', label: 'Next Run', render: (row: TrainingReportRow) => dateValue(row.next_run_at) }
];
export const downloadColumns = [
  { key: 'downloaded_at', label: 'Downloaded At', render: (row: TrainingReportRow) => dateValue(row.downloaded_at) },
  { key: 'downloaded_by', label: 'Downloaded By' },
  { key: 'download_method', label: 'Method' },
  { key: 'allowed', label: 'Status', render: (row: TrainingReportRow) => <ReportDownloadStatusBadge allowed={row.allowed} /> },
  { key: 'confidentiality_level', label: 'Classification', render: (row: TrainingReportRow) => <ConfidentialityBadge level={row.confidentiality_level} /> }
];
export const historyColumns = [
  { key: 'event_title', label: 'Event' },
  { key: 'event_type', label: 'Type' },
  { key: 'event_category', label: 'Category' },
  { key: 'actor_user_id', label: 'Actor' },
  { key: 'created_at', label: 'Created', render: (row: TrainingReportRow) => dateValue(row.created_at) }
];

export function TrainingReportsTable({ title, data, columns, empty = 'No records found.' }: { title: string; data: TrainingReportList | TrainingReportRow[] | undefined; columns: Array<{ key: string; label: string; render?: (row: TrainingReportRow) => React.ReactNode }>; empty?: string | undefined }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return (
    <TrainingCard title={title} subtitle={`${rows.length} visible records from backend.`}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{columns.map((col) => <th key={col.key} className="border-b border-[var(--psm-line)] px-3 py-2">{col.label}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.id ?? row.report_code ?? row.template_code ?? index} className="border-b border-[var(--psm-line)] last:border-0">{columns.map((col) => <td key={col.key} className="px-3 py-3 align-top">{col.render ? col.render(row) : String(value(row, [col.key], ''))}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : <TrainingEmptyState title="Empty" message={empty} />}
    </TrainingCard>
  );
}

export function TrainingReportsDashboardContent({ data }: { data: TrainingReportsDashboard | undefined }) {
  return (
    <>
      <TrainingReportsSummaryCards data={data} />
      <TrainingReportsFilters />
      <TrainingReportsCharts data={data} />
      <div className="grid gap-4 xl:grid-cols-2">
        <TrainingReportsTable title="Generated Reports" data={data?.recentGeneratedReports ?? []} columns={generatedColumns} />
        <TrainingReportsTable title="Export Jobs" data={data?.recentExportJobs ?? []} columns={jobColumns} />
        <TrainingReportsTable title="Evidence Packages" data={data?.auditEvidencePackages ?? []} columns={packageColumns} />
        <TrainingReportsTable title="Scheduled Reports" data={data?.scheduledReportPreview ?? []} columns={scheduledColumns} />
        <TrainingReportsTable title="Download Activity" data={data?.downloadActivity ?? []} columns={downloadColumns} />
        <TrainingReportsTable title="Recent History" data={data?.recentHistory ?? []} columns={historyColumns} />
      </div>
      <TrainingReportsQuickLinks />
    </>
  );
}

export function TrainingReportsQuickLinks() {
  const links: Array<[string, string]> = [
    ['/training-competency/reports/templates', 'Templates'],
    ['/training-competency/reports/export/new', 'New Export'],
    ['/training-competency/reports/generated', 'Generated'],
    ['/training-competency/reports/packages', 'Packages'],
    ['/training-competency/reports/scheduled', 'Scheduled'],
    ['/training-competency/reports/audit-evidence', 'Audit Evidence'],
    ['/training-competency/reports/downloads', 'Downloads'],
    ['/training-competency/reports/settings', 'Settings']
  ];
  return <TrainingCard title="Quick Links / Navigation" subtitle="Report-specific routes from the PDF."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{links.map(([href, label]) => <Link key={href} href={href} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold hover:bg-[var(--psm-surface-3)]">{label}</Link>)}</div></TrainingCard>;
}

export function TrainingReportGeneratorForm({ mode = 'generate' }: { mode?: 'generate' | 'package' | 'scheduled' | 'template' }) {
  const lookups = useTrainingReportLookups();
  const mutations = useTrainingReportMutations();
  const [form, setForm] = useState<Record<string, any>>({ reportType: '', sourceModule: '', exportFormat: '', reportTitle: '', packageType: '', scheduleTitle: '', frequency: '', confidentialityLevel: '' });
  const update = (key: string, val: string | boolean) => setForm((prev) => ({ ...prev, [key]: val }));
  const disabledReason = !form.reportType || !form.sourceModule || !form.exportFormat ? 'Report type, source module and export format are required.' : mode === 'template' && !form.reportTitle ? 'Template/report title is required.' : mode === 'scheduled' && !form.scheduleTitle ? 'Schedule title is required.' : mode === 'package' && !form.packageType ? 'Package type is required.' : undefined;
  const run = () => {
    if (mode === 'package') mutations.createPackage.mutate({ packageTitle: form.reportTitle || 'Training Evidence Package', packageType: form.packageType, sourceModule: form.sourceModule });
    else if (mode === 'scheduled') mutations.createScheduled.mutate(form);
    else if (mode === 'template') mutations.createTemplate.mutate({ templateName: form.reportTitle, templateCode: form.reportTitle?.toUpperCase()?.replaceAll(' ', '-'), reportType: form.reportType, sourceModule: form.sourceModule, defaultFormat: form.exportFormat });
    else mutations.generate.mutate(form);
  };
  const pending = mutations.generate.isPending || mutations.createPackage.isPending || mutations.createScheduled.isPending || mutations.createTemplate.isPending;
  const types = lookups.data?.trainingReportTypes ?? [];
  const modules = lookups.data?.trainingSourceModules ?? [];
  const formats = lookups.data?.trainingReportFormats ?? [];
  return (
    <TrainingCard title={mode === 'template' ? 'Report Template Builder' : mode === 'scheduled' ? 'Scheduled Report Builder' : mode === 'package' ? 'Report Package Builder' : 'Report Section Builder / Export Options'} subtitle="Generation, exports and packages are created through backend APIs with audit/history events.">
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder={mode === 'scheduled' ? 'Schedule title' : 'Report / template title'} value={mode === 'scheduled' ? form.scheduleTitle : form.reportTitle} onChange={(event) => update(mode === 'scheduled' ? 'scheduleTitle' : 'reportTitle', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.reportType} onChange={(event) => update('reportType', event.target.value)}><option value="">Select report type</option>{types.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.sourceModule} onChange={(event) => update('sourceModule', event.target.value)}><option value="">Select source module</option>{modules.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.exportFormat} onChange={(event) => update('exportFormat', event.target.value)}><option value="">Select export format</option>{formats.map((item) => <option key={item}>{item}</option>)}</select>
        {mode === 'package' ? <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.packageType} onChange={(event) => update('packageType', event.target.value)}><option value="">Select package type</option>{(lookups.data?.trainingPackageTypes ?? []).map((item) => <option key={item}>{item}</option>)}</select> : null}
        {mode === 'scheduled' ? <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.frequency} onChange={(event) => update('frequency', event.target.value)}><option value="">Select frequency</option>{(lookups.data?.trainingScheduledReportFrequencies ?? []).map((item) => <option key={item}>{item}</option>)}</select> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <TrainingButton onClick={run} disabled={Boolean(disabledReason) || pending} title={disabledReason}>{pending ? 'Saving...' : mode === 'template' ? 'Save Template' : mode === 'scheduled' ? 'Create Schedule' : mode === 'package' ? 'Generate Package' : 'Generate Report'}</TrainingButton>
        <TrainingButton variant="secondary" onClick={() => mutations.preview.mutate(form)} disabled={mutations.preview.isPending}>{mutations.preview.isPending ? 'Previewing...' : 'Preview'}</TrainingButton>
      </div>
      {mutations.preview.data ? <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(mutations.preview.data, null, 2)}</pre> : null}
    </TrainingCard>
  );
}

export function TrainingReportsListPage({ title, subtitle, query, columns, actions }: { title: string; subtitle: string; query: { isLoading: boolean; isError: boolean; error: unknown; data: TrainingReportList | undefined; refetch: () => void }; columns: Array<{ key: string; label: string; render?: (row: TrainingReportRow) => React.ReactNode }>; actions?: React.ReactNode }) {
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <TrainingReportsLayout title={title} subtitle={subtitle} actions={<>{actions}<TrainingButton variant="secondary" onClick={() => query.refetch()}>Refresh</TrainingButton></>}><TrainingReportsFilters /><TrainingReportsTable title={title} data={query.data} columns={columns} /></TrainingReportsLayout>;
}

export function TrainingReportDetailPanel({ data }: { data: Record<string, any> | undefined }) {
  const entries = useMemo(() => Object.entries(data?.report ?? data?.template ?? data?.job ?? data?.package ?? data?.schedule ?? data ?? {}).filter(([key]) => !key.endsWith('_json')).slice(0, 24), [data]);
  return <TrainingCard title="Detail / Preview" subtitle="Backend record detail, source snapshot, files, history and metadata.">{entries.length ? <div className="grid gap-3 md:grid-cols-2">{entries.map(([key, val]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="mt-1 break-words text-sm font-semibold">{typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'Not recorded')}</p></div>)}</div> : <TrainingEmptyState title="No detail" message="The backend did not return a detail record for this item." />}</TrainingCard>;
}
