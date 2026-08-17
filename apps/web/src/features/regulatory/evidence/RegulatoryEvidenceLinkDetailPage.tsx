'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryBadge, RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import { RegulatoryEvidenceReviewStatusBadge } from '../shared/RegulatoryEvidenceReviewStatusBadge';
import { RegulatoryEvidenceStatusBadge } from '../shared/RegulatoryEvidenceStatusBadge';
import { RegulatoryEvidenceTypeBadge } from '../shared/RegulatoryEvidenceTypeBadge';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';
import { useRegulatoryEvidenceLinkDetail } from '../hooks/useRegulatoryEvidenceLinkDetail';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';
import type { RegulatoryEvidenceLink } from '../types/regulatory-evidence.types';

export function RegulatoryEvidenceLinkDetailPage({ evidenceLinkId, tab = 'overview' }: { evidenceLinkId: string; tab?: 'overview' | 'source' | 'preview' | 'review' | 'chain-of-custody' | 'access-log' | 'history' }) {
  const query = useRegulatoryEvidenceLinkDetail(evidenceLinkId);
  const preview = useQuery({ queryKey: ['regulatory', 'evidence', 'preview', evidenceLinkId], queryFn: () => regulatoryEvidenceService.preview(evidenceLinkId), enabled: tab === 'preview' });
  const chain = useQuery({ queryKey: ['regulatory', 'evidence', 'chain', evidenceLinkId], queryFn: () => regulatoryEvidenceService.chain(evidenceLinkId), enabled: tab === 'chain-of-custody' });
  const access = useQuery({ queryKey: ['regulatory', 'evidence', 'access', evidenceLinkId], queryFn: () => regulatoryEvidenceService.accessLog({ evidenceLinkId }), enabled: tab === 'access-log' });
  const history = useQuery({ queryKey: ['regulatory', 'evidence', 'history', evidenceLinkId], queryFn: () => regulatoryEvidenceService.history({ evidenceLinkId }), enabled: tab === 'history' });
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const row = query.data;
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title={row?.evidence_title ?? 'Evidence Link'} subtitle={`${row?.evidence_code ?? evidenceLinkId} · ${row?.source_module ?? row?.source_type ?? 'Regulatory Evidence'}`} onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/evidence/links/new">Link Evidence</RegulatoryButton>} />
        <DetailTabs id={evidenceLinkId} active={tab} />
        <HeaderCards row={row} />
        {tab === 'overview' ? <Overview row={row} /> : null}
        {tab === 'source' ? <JsonPanel title="Source Snapshot" value={row?.source_snapshot_json ?? row} /> : null}
        {tab === 'preview' ? <PreviewPanel loading={preview.isLoading} error={preview.error} value={preview.data} /> : null}
        {tab === 'review' ? <ReviewPanel row={row} evidenceLinkId={evidenceLinkId} /> : null}
        {tab === 'chain-of-custody' ? <RowsPanel title="Chain of Custody" loading={chain.isLoading} rows={chain.data?.rows} /> : null}
        {tab === 'access-log' ? <RowsPanel title="Access Log" loading={access.isLoading} rows={access.data?.rows} /> : null}
        {tab === 'history' ? <RowsPanel title="Evidence History" loading={history.isLoading} rows={history.data?.rows} /> : null}
      </div>
    </RegulatoryLayout>
  );
}

function DetailTabs({ id, active }: { id: string; active: string }) {
  const tabs = ['overview', 'source', 'preview', 'review', 'chain-of-custody', 'access-log', 'history'];
  return <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{tabs.map((tab) => <a key={tab} href={`/regulatory/evidence/links/${id}/${tab === 'overview' ? 'overview' : tab}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active === tab ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{tab.replaceAll('-', ' ')}</a>)}</div>;
}

function HeaderCards({ row }: { row?: RegulatoryEvidenceLink | undefined }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><RegulatoryCard><RegulatoryEvidenceStatusBadge status={row?.evidence_status} /></RegulatoryCard><RegulatoryCard><RegulatoryEvidenceReviewStatusBadge status={row?.review_status} /></RegulatoryCard><RegulatoryCard><RegulatoryEvidenceReadinessBadge status={row?.readiness_status} /></RegulatoryCard><RegulatoryCard><RegulatoryEvidenceTypeBadge type={row?.evidence_type} /></RegulatoryCard><RegulatoryCard><RegulatoryBadge tone={row?.restricted ? 'danger' : 'good'}>{row?.restricted ? 'Restricted' : 'Standard Access'}</RegulatoryBadge></RegulatoryCard></div>;
}

function Overview({ row }: { row?: RegulatoryEvidenceLink | undefined }) {
  return <div className="grid gap-5 xl:grid-cols-2"><JsonPanel title="Evidence Metadata" value={row} /><RegulatoryCard title="Controlled Reference / Access"><dl className="grid gap-3 text-sm"><Data label="Document Control ID" value={row?.document_id} /><Data label="Storage file ID" value={row?.storage_file_id} /><Data label="Audit evidence ID" value={row?.audit_evidence_id} /><Data label="External URL" value={row?.external_reference_url} /><Data label="Expiry" value={row?.expiry_date ? new Date(row.expiry_date).toLocaleString() : null} /><Data label="Restricted reason" value={row?.restricted_reason} /></dl></RegulatoryCard></div>;
}

function ReviewPanel({ row, evidenceLinkId }: { row?: RegulatoryEvidenceLink | undefined; evidenceLinkId: string }) {
  const mutations = useRegulatoryEvidenceMutations();
  const [reason, setReason] = useState('');
  const common = { reason };
  return <RegulatoryCard title="Evidence Review" subtitle="Review mutations are backend-controlled and create audit/history events."><div className="space-y-3"><textarea className="min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Review comment, rejection reason, or rework instructions" /><div className="flex flex-wrap gap-2"><RegulatoryButton onClick={() => mutations.submitReview.mutate({ id: evidenceLinkId, data: common })} disabled={mutations.submitReview.isPending} title={mutations.submitReview.isPending ? 'Submitting review request...' : undefined}>Submit for Review</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => mutations.verify.mutate({ id: evidenceLinkId, data: common })}>Verify</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => mutations.requestRework.mutate({ id: evidenceLinkId, data: common })}>Request Rework</RegulatoryButton><RegulatoryButton variant="danger" onClick={() => mutations.reject.mutate({ id: evidenceLinkId, data: common })} disabled={!reason.trim()} title={!reason.trim() ? 'Rejection requires a reason.' : undefined}>Reject</RegulatoryButton></div><p className="text-sm text-[var(--psm-muted)]">Current status: {row?.review_status ?? 'Not Submitted'}</p></div></RegulatoryCard>;
}

function PreviewPanel({ loading, error, value }: { loading: boolean; error: unknown; value: unknown }) {
  if (loading) return <RegulatoryLoadingState rows={3} />;
  if (error) return <RegulatoryErrorState message={error} />;
  return <JsonPanel title="Preview / Download Adapter" value={value} />;
}

function RowsPanel({ title, loading, rows }: { title: string; loading: boolean; rows?: Array<Record<string, unknown>> | undefined }) {
  if (loading) return <RegulatoryLoadingState rows={4} />;
  return <RegulatoryCard title={title}>{rows?.length ? <div className="space-y-3">{rows.map((row, index) => <pre key={String(row.id ?? index)} className="overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(row, null, 2)}</pre>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend records for this panel.</p>}</RegulatoryCard>;
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <RegulatoryCard title={title}><pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(value ?? {}, null, 2)}</pre></RegulatoryCard>;
}

function Data({ label, value }: { label: string; value?: string | null | undefined }) {
  return <div><dt className="text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">{label}</dt><dd className="mt-1 font-semibold text-[var(--psm-fg)]">{value || 'Not set'}</dd></div>;
}
