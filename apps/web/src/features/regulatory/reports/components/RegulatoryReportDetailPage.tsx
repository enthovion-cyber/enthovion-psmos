'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { RegulatoryHeader } from '../../RegulatoryHeader';
import { RegulatoryLayout } from '../../layout/RegulatoryLayout';
import { RegulatoryBadge, RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../../shared/RegulatoryUi';
import { useRegulatoryReport, useRegulatoryReportMutation } from '../hooks/useRegulatoryReports';
import { RegulatoryReportStatusBadge } from './RegulatoryReportStatusBadge';

const tabs = ['overview', 'source', 'snapshot', 'sections', 'evidence', 'gaps', 'actions', 'audit-mapping', 'review', 'files', 'versions', 'access-log', 'history'];
function rows(value: unknown) { return Array.isArray((value as { rows?: unknown[] })?.rows) ? (value as { rows: Record<string, unknown>[] }).rows : []; }

export function RegulatoryReportDetailPage({ reportId: explicitId }: { reportId?: string }) {
  const params = useParams<{ reportId?: string; tab?: string }>();
  const reportId = explicitId ?? params?.reportId;
  const query = useRegulatoryReport(reportId);
  const mutation = useRegulatoryReportMutation();
  const [active, setActive] = useState(params?.tab ?? 'overview');
  if (query.isLoading) return <RegulatoryLayout current="Report"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Report"><RegulatoryErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load controlled report.'} onRetry={() => void query.refetch()} /></RegulatoryLayout>;
  const detail = query.data; const report = detail?.report;
  if (!detail || !report) return <RegulatoryLayout current="Report"><RegulatoryErrorState message="Report was not found or is outside your permitted scope." /></RegulatoryLayout>;
  const run = (action: 'preview' | 'download' | 'export' | 'regenerate' | 'submitApproval' | 'lock') => void mutation.mutate({ action, reportId });
  const tabData: Record<string, unknown> = { overview: detail.overview, source: detail.source, snapshot: detail.snapshot, sections: detail.sections, evidence: detail.evidence, gaps: detail.gaps, actions: detail.actions, 'audit-mapping': detail.auditMapping, review: detail.review, files: detail.files, versions: detail.versions, 'access-log': detail.accessLog, history: detail.history };
  return <RegulatoryLayout current="Report"><div className="space-y-5"><RegulatoryHeader title={report.report_title} subtitle={`${String(report.report_code ?? report.id)} · ${report.report_type}`} onRefresh={() => void query.refetch()} action={<div className="flex flex-wrap gap-2"><RegulatoryButton variant="secondary" onClick={() => run('preview')} disabled={!detail.permissions?.canPreview} title={!detail.permissions?.canPreview ? String(detail.permissions?.disabledReasons?.preview ?? 'Preview is not permitted.') : undefined}>Preview</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => run('download')} disabled={!detail.permissions?.canDownload} title={!detail.permissions?.canDownload ? String(detail.permissions?.disabledReasons?.download ?? 'Download is not permitted.') : undefined}>Download</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => run('export')} disabled={!detail.permissions?.canExport} title={!detail.permissions?.canExport ? String(detail.permissions?.disabledReasons?.export ?? 'Export is not permitted.') : undefined}>Export</RegulatoryButton><RegulatoryButton onClick={() => run('regenerate')} disabled={!detail.permissions?.canGenerate || detail.readOnly} title={detail.readOnly ? String(detail.readOnlyReason) : !detail.permissions?.canGenerate ? String(detail.permissions?.disabledReasons?.generate) : undefined}>Regenerate</RegulatoryButton></div>} /><div className="flex flex-wrap gap-2"><RegulatoryReportStatusBadge value={report.report_status} /><RegulatoryReportStatusBadge value={report.readiness_status} /><RegulatoryReportStatusBadge value={report.stale_status} />{detail.readOnly ? <RegulatoryBadge tone="warn">{detail.readOnlyReason ?? 'Read-only'}</RegulatoryBadge> : null}</div><nav className="flex gap-2 overflow-x-auto border-b border-[var(--psm-line)] pb-2">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${active === tab ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{tab.replace(/-/g, ' ')}</button>)}</nav><RegulatoryCard title={active.replace(/-/g, ' ')} subtitle="Controlled server data; restricted evidence is redacted by the backend.">{active === 'overview' ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Object.entries(detail.overview?.cards ?? {}).map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-1 break-words text-sm font-semibold text-[var(--psm-fg)]">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</p></div>)}</div> : <ReportData value={tabData[active]} />}</RegulatoryCard>{mutation.isError ? <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{mutation.error instanceof Error ? mutation.error.message : 'The requested report action failed.'}</p> : null}</div></RegulatoryLayout>;
}

function ReportData({ value }: { value: unknown }) {
  const list = rows(value);
  if (list.length) return <div className="space-y-3">{list.map((row) => <article key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><pre className="overflow-auto text-xs text-[var(--psm-muted)]">{JSON.stringify(row, null, 2)}</pre></article>)}</div>;
  return <pre className="max-h-[540px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(value ?? { status: 'No data available for this controlled report tab.' }, null, 2)}</pre>;
}
