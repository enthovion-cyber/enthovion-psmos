'use client';

import Link from 'next/link';
import { RegulatoryHeader } from '../../RegulatoryHeader';
import { RegulatoryLayout } from '../../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../../shared/RegulatoryUi';
import { useRegulatoryReportDashboard } from '../hooks/useRegulatoryReports';
import { RegulatoryReportSummaryCards } from './RegulatoryReportSummaryCards';
import { RegulatoryReportStatusBadge } from './RegulatoryReportStatusBadge';

function PreviewList({ title, rows, empty }: { title: string; rows?: Array<Record<string, unknown>>; empty: string }) {
  return <RegulatoryCard title={title}>{rows?.length ? <div className="divide-y divide-[var(--psm-line)]">{rows.slice(0, 6).map((row) => <Link key={String(row.id)} href={`/regulatory/reports/${String(row.id)}`} className="flex items-center justify-between gap-3 py-3 hover:text-primary"><span className="min-w-0"><span className="block truncate font-semibold">{String(row.report_title ?? row.job_code ?? row.id)}</span><span className="block truncate text-xs text-[var(--psm-muted)]">{String(row.report_type ?? row.error_message ?? '')}</span></span><RegulatoryReportStatusBadge value={String(row.report_status ?? row.job_status ?? row.stale_status ?? '')} /></Link>)}</div> : <p className="text-sm text-[var(--psm-muted)]">{empty}</p>}</RegulatoryCard>;
}

export function RegulatoryReportsDashboardPage() {
  const query = useRegulatoryReportDashboard();
  return <RegulatoryLayout current="Reports Dashboard"><div className="space-y-5"><RegulatoryHeader title="Regulatory Reports Dashboard" subtitle="Live report-generation, readiness, approval, stale-source and access activity across your permitted scope." onRefresh={() => void query.refetch()} />{query.isLoading ? <RegulatoryLoadingState rows={8} /> : query.isError ? <RegulatoryErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load the reports dashboard.'} onRetry={() => void query.refetch()} /> : <><RegulatoryReportSummaryCards summary={query.data?.summary} /><div className="grid gap-5 xl:grid-cols-3"><PreviewList title="Stale source warnings" rows={query.data?.staleReportsPreview} empty="No reports have stale source snapshots." /><PreviewList title="Pending approvals" rows={query.data?.pendingApprovalPreview} empty="No reports are pending approval." /><PreviewList title="Failed jobs" rows={query.data?.failedJobsPreview} empty="No generation jobs have failed." /></div></>}</div></RegulatoryLayout>;
}
