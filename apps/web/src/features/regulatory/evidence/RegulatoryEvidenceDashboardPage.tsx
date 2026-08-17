'use client';

import Link from 'next/link';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceDashboard } from '../hooks/useRegulatoryEvidenceDashboard';
import { RegulatoryEvidenceSummaryCards } from './RegulatoryEvidenceSummaryCards';
import type { RegulatoryBreakdown } from '../types/regulatory.types';
import type { RegulatoryEvidenceGap, RegulatoryEvidenceLink, RegulatoryEvidencePackage, RegulatoryEvidenceRequest } from '../types/regulatory-evidence.types';

export function RegulatoryEvidenceDashboardPage() {
  const query = useRegulatoryEvidenceDashboard({});
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.summary?.evidenceTotal ?? 0) && !Number(data?.summary?.requirementsTotal ?? 0);
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory Evidence" subtitle={data?.header?.subtitle ?? 'Evidence requirements, links, review workflow, chain of custody, access logging, gaps, and package foundation.'} onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/links/new">Link Evidence</RegulatoryButton>} />
        {empty ? <RegulatoryEmptyState title="No regulatory evidence yet" message="No evidence requirements or evidence links exist in this company/site scope. Start with an evidence requirement or link controlled evidence." action={<RegulatoryButton href="/regulatory/evidence/requirements/new">Create Requirement</RegulatoryButton>} /> : null}
        <RegulatoryEvidenceSummaryCards summary={data?.summary} />
        <div className="grid gap-5 xl:grid-cols-2">
          <BreakdownPanel title="Evidence Status" rows={data?.byStatus} />
          <BreakdownPanel title="Review Status" rows={data?.byReviewStatus} />
          <BreakdownPanel title="Readiness" rows={data?.byReadiness} />
          <BreakdownPanel title="Source Module" rows={data?.bySourceModule} />
          <BreakdownPanel title="Evidence Type" rows={data?.byEvidenceType} />
          <BreakdownPanel title="Site Scope" rows={data?.bySite} />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <EvidencePreview title="Missing Evidence" rows={data?.missingPreview} href="/regulatory/evidence/missing" />
          <EvidencePreview title="Pending Review" rows={data?.pendingReviewPreview} href="/regulatory/evidence/pending-review" />
          <EvidencePreview title="Stale / Source Changed" rows={data?.stalePreview} href="/regulatory/evidence/stale" />
          <GapPreview title="Open Evidence Gaps" rows={data?.openGapPreview} href="/regulatory/evidence/gaps" />
          <RequestPreview title="Open Evidence Requests" rows={data?.openRequestPreview} href="/regulatory/evidence/requests" />
          <PackagePreview title="Evidence Packages" rows={data?.packagePreview} href="/regulatory/evidence/packages" />
        </div>
      </div>
    </RegulatoryLayout>
  );
}

function BreakdownPanel({ title, rows }: { title: string; rows?: RegulatoryBreakdown[] | undefined }) {
  return <RegulatoryCard title={title}>{rows?.length ? <div className="space-y-2">{rows.map((row) => <div key={row.label} className="flex justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span>{row.label}</span><b>{row.count}</b></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend data for this breakdown.</p>}</RegulatoryCard>;
}

function EvidencePreview({ title, rows, href }: { title: string; rows?: RegulatoryEvidenceLink[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? <div className="space-y-3">{rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/links/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary"><div className="font-semibold text-primary">{row.evidence_code ?? row.id}</div><div className="text-sm text-[var(--psm-fg)]">{row.evidence_title}</div><div className="text-xs text-[var(--psm-muted)]">{row.evidence_status} · {row.review_status} · {row.readiness_status}</div></Link>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No evidence records match this panel.</p>}</RegulatoryCard>;
}

function GapPreview({ title, rows, href }: { title: string; rows?: RegulatoryEvidenceGap[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? rows.map((row) => <Link key={row.id} href={href} className="mb-3 block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><b>{row.gap_code ?? row.id}</b><div className="text-sm text-[var(--psm-muted)]">{row.gap_title} · {row.gap_status}</div></Link>) : <p className="text-sm text-[var(--psm-muted)]">No open evidence gaps.</p>}</RegulatoryCard>;
}

function RequestPreview({ title, rows, href }: { title: string; rows?: RegulatoryEvidenceRequest[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/requests/${row.id}`} className="mb-3 block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><b>{row.request_code ?? row.id}</b><div className="text-sm text-[var(--psm-muted)]">{row.request_title} · {row.request_status}</div></Link>) : <p className="text-sm text-[var(--psm-muted)]">No open evidence requests.</p>}</RegulatoryCard>;
}

function PackagePreview({ title, rows, href }: { title: string; rows?: RegulatoryEvidencePackage[] | undefined; href: string }) {
  return <RegulatoryCard title={title} action={<RegulatoryButton href={href} variant="secondary">Open</RegulatoryButton>}>{rows?.length ? rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/packages/${row.id}`} className="mb-3 block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><b>{row.package_code ?? row.id}</b><div className="text-sm text-[var(--psm-muted)]">{row.package_title} · {row.package_status}</div></Link>) : <p className="text-sm text-[var(--psm-muted)]">No evidence packages have been prepared.</p>}</RegulatoryCard>;
}
