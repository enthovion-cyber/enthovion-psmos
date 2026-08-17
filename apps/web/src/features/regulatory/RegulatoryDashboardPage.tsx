'use client';

import Link from 'next/link';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatorySummaryCards } from './RegulatorySummaryCards';
import { RegulatoryCard, RegulatoryButton, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from './shared/RegulatoryUi';
import { useRegulatoryDashboard } from './hooks/useRegulatoryDashboard';
import type { RegulatoryBreakdown, RegulatoryItem } from './types/regulatory.types';

export function RegulatoryDashboardPage() {
  const query = useRegulatoryDashboard({});
  if (query.isLoading) return <RegulatoryLayout current="Dashboard"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Dashboard"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data ?? {};
  const empty = !Number(data.summary?.totalRegisterItems ?? 0);
  return (
    <RegulatoryLayout current="Dashboard">
      <div className="space-y-5">
        <RegulatoryHeader subtitle={data.header?.subtitle ?? 'Central source of truth for regulatory requirements, standards, permits, codes, applicability, owners, links, review due dates, and Phase 1 compliance status foundation.'} onRefresh={() => query.refetch()} />
        {empty ? <RegulatoryEmptyState title="No register items" message="No laws, regulations, standards, permits, or legal requirements exist in the selected company/site scope yet." action={<RegulatoryButton href="/regulatory/new">Add Regulatory Requirement</RegulatoryButton>} /> : null}
        <RegulatorySummaryCards summary={data.summary} />
        <div className="grid gap-5 xl:grid-cols-2">
          <BreakdownPanel title="Compliance Status Overview" rows={data.complianceStatusOverview} />
          <BreakdownPanel title="Register Items By Jurisdiction" rows={data.byJurisdiction} />
          <BreakdownPanel title="Register Items By Site" rows={data.bySite} />
          <BreakdownPanel title="Register Items By Unit" rows={data.byUnit} />
          <BreakdownPanel title="Register Items By Category" rows={data.byCategory} />
          <BreakdownPanel title="Register Items By Source Type" rows={data.bySourceType} />
          <BreakdownPanel title="Register Items By Criticality" rows={data.byCriticality} />
          <ReadinessPanel readiness={data.readinessSummary} />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <PreviewPanel title="Review Due Soon" rows={data.reviewDueSoon} href="/regulatory/overdue-review" />
          <PreviewPanel title="Effective Dates Upcoming" rows={data.effectiveSoon} href="/regulatory/effective-soon" />
          <PreviewPanel title="Missing Owner Preview" rows={data.missingOwnerPreview} href="/regulatory/missing-owner" />
          <PreviewPanel title="Missing Applicability Preview" rows={data.missingApplicabilityPreview} href="/regulatory/missing-applicability" />
          <PreviewPanel title="Missing Evidence Preview" rows={data.missingEvidencePreview} href="/regulatory/missing-evidence" />
          <PreviewPanel title="High-Risk Requirements Preview" rows={data.highRiskPreview} href="/regulatory/high-risk" />
          <PreviewPanel title="PSM-Critical Requirements Preview" rows={data.psmCriticalPreview} href="/regulatory/psm-critical" />
          <PreviewPanel title="Environmental-Critical Requirements Preview" rows={data.environmentalCriticalPreview} href="/regulatory/environmental-critical" />
          <PreviewPanel title="Audit-Linked Requirements Preview" rows={data.auditLinkedPreview} href="/regulatory/audit-mapping" />
          <PreviewPanel title="Recently Added / Updated Register Items" rows={data.recentChanges} href="/regulatory/register" />
        </div>
      </div>
    </RegulatoryLayout>
  );
}

function BreakdownPanel({ title, rows }: { title: string; rows?: RegulatoryBreakdown[] | undefined }) {
  return (
    <RegulatoryCard title={title} subtitle="Backend aggregation for the selected company/site scope.">
      {rows?.length ? <div className="space-y-3">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--psm-surface-2)] px-3 py-2"><span className="truncate text-sm text-[var(--psm-fg)]">{row.label}</span><span className="font-bold text-primary">{row.count}</span></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No data available for this breakdown.</p>}
    </RegulatoryCard>
  );
}

function PreviewPanel({ title, rows, href }: { title: string; rows?: RegulatoryItem[] | undefined; href: string }) {
  return (
    <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>
      {rows?.length ? <div className="space-y-3">{rows.map((row) => <Link key={row.id} href={`/regulatory/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary"><div className="font-semibold text-[var(--psm-fg)]">{row.requirement_code} - {row.requirement_title}</div><div className="mt-1 text-xs text-[var(--psm-muted)]">{row.category ?? 'No category'} · {row.criticality ?? 'No criticality'} · {row.review_status ?? 'No review status'}</div></Link>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No records match this panel.</p>}
    </RegulatoryCard>
  );
}

function ReadinessPanel({ readiness }: { readiness?: { status?: string; blockers?: Array<{ key: string; label: string; count: number }> } | undefined }) {
  return (
    <RegulatoryCard title="Regulatory Readiness Summary" subtitle="Foundation readiness from backend-derived ownership, applicability, evidence, and review signals.">
      <div className="mb-3 text-lg font-bold text-[var(--psm-fg)]">{readiness?.status ?? 'Not Assessed'}</div>
      <div className="space-y-2">{(readiness?.blockers ?? []).map((blocker) => <div key={blocker.key} className="flex justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span>{blocker.label}</span><b>{blocker.count}</b></div>)}</div>
    </RegulatoryCard>
  );
}
