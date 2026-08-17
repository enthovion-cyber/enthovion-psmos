'use client';

import Link from 'next/link';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryButton, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryComplianceSummaryCards } from './RegulatoryComplianceSummaryCards';
import { useRegulatoryComplianceDashboard } from '../hooks/useRegulatoryComplianceDashboard';
import type { RegulatoryBreakdown } from '../types/regulatory.types';
import type { RegulatoryComplianceAssessment, RegulatoryComplianceGap } from '../types/regulatory-compliance.types';

export function RegulatoryComplianceDashboardPage() {
  const query = useRegulatoryComplianceDashboard({});
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.summary?.totalComplianceAssessments ?? 0);
  return (
    <RegulatoryLayout current="Compliance Status">
      <div className="space-y-5">
        <RegulatoryHeader title="Compliance Status" subtitle={data?.header?.subtitle ?? 'Compliance assessment, gap, evidence readiness, stale status, and rollup foundation.'} onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/compliance-status/assessments/new">New Assessment</RegulatoryButton>} />
        {empty ? <RegulatoryEmptyState title="No compliance assessments" message="No compliance status assessment exists in the selected company/site scope. Start an assessment from a regulatory item or obligation." action={<RegulatoryButton href="/regulatory/compliance-status/assessments/new">Start Assessment</RegulatoryButton>} /> : null}
        <RegulatoryComplianceSummaryCards summary={data?.summary} />
        <div className="grid gap-5 xl:grid-cols-2">
          <BreakdownPanel title="Compliance Status By Decision" rows={data?.byStatus} />
          <BreakdownPanel title="Evidence Readiness" rows={data?.byEvidenceReadiness} />
          <BreakdownPanel title="By Site" rows={data?.bySite} />
          <BreakdownPanel title="By Unit" rows={data?.byUnit} />
          <BreakdownPanel title="By Category" rows={data?.byCategory} />
          <BreakdownPanel title="By Owner" rows={data?.byOwner} />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <AssessmentPreview title="Critical Non-Compliant Preview" rows={data?.criticalNonCompliantPreview} href="/regulatory/compliance-status/non-compliant" />
          <AssessmentPreview title="Evidence Missing Preview" rows={data?.evidenceMissingPreview} href="/regulatory/compliance-status/evidence-missing" />
          <AssessmentPreview title="Action Required Preview" rows={data?.actionRequiredPreview} href="/regulatory/compliance-status/action-required" />
          <AssessmentPreview title="Stale Compliance Preview" rows={data?.stalePreview} href="/regulatory/compliance-status/stale" />
          <GapPreview title="Open Gap Preview" rows={data?.openGapPreview} href="/regulatory/compliance-status/gaps" />
          <AssessmentPreview title="Recent Assessments" rows={data?.recentAssessments} href="/regulatory/compliance-status/register" />
        </div>
      </div>
    </RegulatoryLayout>
  );
}

function BreakdownPanel({ title, rows }: { title: string; rows?: RegulatoryBreakdown[] | undefined }) {
  return <RegulatoryCard title={title}>{rows?.length ? <div className="space-y-2">{rows.map((row) => <div key={row.label} className="flex justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span>{row.label}</span><b>{row.count}</b></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend data for this breakdown.</p>}</RegulatoryCard>;
}

function AssessmentPreview({ title, rows, href }: { title: string; rows?: RegulatoryComplianceAssessment[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? <div className="space-y-3">{rows.map((row) => <Link key={row.id} href={`/regulatory/compliance-status/assessments/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary"><div className="font-semibold text-[var(--psm-fg)]">{row.assessment_number} - {row.assessment_title}</div><div className="text-xs text-[var(--psm-muted)]">{row.compliance_status} · {row.evidence_readiness_status} · {row.owner_label ?? 'Unassigned'}</div></Link>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No records match this panel.</p>}</RegulatoryCard>;
}

function GapPreview({ title, rows, href }: { title: string; rows?: RegulatoryComplianceGap[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? <div className="space-y-3">{rows.map((row) => <Link key={row.id} href={href} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary"><div className="font-semibold text-[var(--psm-fg)]">{row.gap_number} - {row.gap_title}</div><div className="text-xs text-[var(--psm-muted)]">{row.gap_type} · {row.severity} · {row.gap_status}</div></Link>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No open gaps in this panel.</p>}</RegulatoryCard>;
}
