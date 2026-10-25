'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, RegulatoryMetricCard, regulatoryInputClass } from '../shared/RegulatoryUi';
import { RegulatoryManagementReviewReadinessBadge, RegulatoryRepeatGapStatusBadge } from '../shared/RegulatoryTrendBadges';
import { useRegulatoryKpiFeed, useRegulatoryManagementReviewCandidates, useRegulatoryManagementReviewReadiness, useRegulatoryRecurringIssues, useRegulatoryRepeatGaps, useRegulatoryTrendMutations } from '../hooks/useRegulatoryTrends';
import { regulatoryTrendService } from '../services/regulatory-trend.service';

export function RegulatoryRepeatGapPage() {
  const query = useRegulatoryRepeatGaps();
  const mutations = useRegulatoryTrendMutations();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'confirm' | 'reject' | 'archive' }) => regulatoryTrendService.reviewRepeatGap(id, decision, reason),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['regulatory', 'phase11', 'repeat-gaps'] }); }
  });
  if (query.isLoading) return <RegulatoryLayout current="Trends"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Trends"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Trends"><div className="space-y-5">
    <RegulatoryHeader title="Repeat Regulatory Gaps" subtitle="Potential repeats are backend-detected from real unresolved gap records. Confirmation or rejection requires a reason." onRefresh={() => query.refetch()} action={<RegulatoryButton onClick={() => mutations.detectRepeats.mutate()} disabled={mutations.detectRepeats.isPending}>{mutations.detectRepeats.isPending ? 'Detecting...' : 'Detect repeats'}</RegulatoryButton>} />
    <RegulatoryCard title="Review reason" subtitle="Required before confirming, rejecting, or archiving a repeat gap."><input className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Enter review reason" /></RegulatoryCard>
    <RegulatoryCard title={`Repeat gaps (${query.data?.total ?? 0})`}>{query.data?.rows.length ? <div className="space-y-3">{query.data.rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-[var(--psm-fg)]">{row.repeat_title}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.repeat_code ?? row.id} - {row.occurrence_count} occurrence(s) - confidence: {row.match_confidence ?? 'Not calculated'}</p></div><RegulatoryRepeatGapStatusBadge value={row.repeat_status} /></div><div className="mt-3 flex flex-wrap gap-2"><RegulatoryButton variant="secondary" onClick={() => review.mutate({ id: row.id, decision: 'confirm' })} disabled={!reason || review.isPending} title={!reason ? 'Enter a confirmation reason.' : undefined}>Confirm</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => review.mutate({ id: row.id, decision: 'reject' })} disabled={!reason || review.isPending} title={!reason ? 'Enter a rejection reason.' : undefined}>Reject</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => review.mutate({ id: row.id, decision: 'archive' })} disabled={!reason || review.isPending} title={!reason ? 'Enter an archive reason.' : undefined}>Archive</RegulatoryButton></div></div>)}</div> : <RegulatoryEmptyState title="No repeat gaps" message="Detection only returns groupings supported by real unresolved source records." />}</RegulatoryCard>
  </div></RegulatoryLayout>;
}

export function RegulatoryRecurringIssuePage() {
  const query = useRegulatoryRecurringIssues();
  const mutations = useRegulatoryTrendMutations();
  if (query.isLoading) return <RegulatoryLayout current="Trends"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Trends"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Trends"><div className="space-y-5"><RegulatoryHeader title="Recurring Regulatory Issues" subtitle="Clusters are record-based governance signals, not root-cause conclusions." onRefresh={() => query.refetch()} action={<RegulatoryButton onClick={() => mutations.detectRecurring.mutate()} disabled={mutations.detectRecurring.isPending}>{mutations.detectRecurring.isPending ? 'Detecting...' : 'Detect clusters'}</RegulatoryButton>} /><RegulatoryCard title={`Recurring issue clusters (${query.data?.total ?? 0})`}>{query.data?.rows.length ? <div className="grid gap-3 lg:grid-cols-2">{query.data.rows.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="font-semibold text-[var(--psm-fg)]">{String(row.cluster_title)}</p><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.cluster_type)} - {Number(row.source_record_count ?? 0)} source records</p><p className="mt-1 text-xs text-[var(--psm-muted)]">Direction: {String(row.trend_direction ?? 'Insufficient Data')} - Status: {String(row.cluster_status)}</p></div>)}</div> : <RegulatoryEmptyState title="No recurring issue clusters" message="Run repeat-gap detection first; clusters are created only when real repeat groups meet the configured threshold." />}</RegulatoryCard></div></RegulatoryLayout>;
}

export function RegulatoryManagementReviewReadinessPage() {
  const dashboard = useRegulatoryManagementReviewReadiness();
  const candidates = useRegulatoryManagementReviewCandidates();
  const client = useQueryClient();
  const [values, setValues] = useState({ sourceModule: '', sourceRecordType: '', sourceRecordId: '', reason: '', candidateTitle: '' });
  const create = useMutation({ mutationFn: regulatoryTrendService.createCandidate, onSuccess: () => { setValues({ sourceModule: '', sourceRecordType: '', sourceRecordId: '', reason: '', candidateTitle: '' }); void client.invalidateQueries({ queryKey: ['regulatory', 'phase11', 'management-review'] }); } });
  if (dashboard.isLoading || candidates.isLoading) return <RegulatoryLayout current="Management Review Readiness"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (dashboard.isError || candidates.isError) return <RegulatoryLayout current="Management Review Readiness"><RegulatoryErrorState message={dashboard.error ?? candidates.error} onRetry={() => { void dashboard.refetch(); void candidates.refetch(); }} /></RegulatoryLayout>;
  const data = dashboard.data ?? {};
  const summary = (data.summary ?? {}) as Record<string, unknown>;
  const metrics: Array<{ label: string; key: string }> = [{ label: 'Candidates', key: 'totalManagementReviewCandidates' }, { label: 'Critical open gaps', key: 'criticalOpenRegulatoryGaps' }, { label: 'Repeat gaps', key: 'repeatGaps' }, { label: 'Overdue critical actions', key: 'overdueCriticalActions' }, { label: 'KPI feed ready', key: 'kpiFeedReady' }];
  const fields: Array<{ key: keyof typeof values; label: string }> = [{ key: 'sourceModule', label: 'Source module' }, { key: 'sourceRecordType', label: 'Source record type' }, { key: 'sourceRecordId', label: 'Source record ID' }, { key: 'candidateTitle', label: 'Candidate title' }, { key: 'reason', label: 'Reason' }];
  return <RegulatoryLayout current="Management Review Readiness"><div className="space-y-5"><RegulatoryHeader title="Management Review Readiness" subtitle="Leadership candidates are derived from real unresolved records; readiness includes the backend trace." onRefresh={() => { void dashboard.refetch(); void candidates.refetch(); }} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <RegulatoryMetricCard key={metric.key} label={metric.label} value={typeof summary[metric.key] === 'boolean' ? (summary[metric.key] ? 'Ready' : 'Blocked') : Number(summary[metric.key] ?? 0)} tone={metric.key === 'criticalOpenRegulatoryGaps' && Number(summary[metric.key] ?? 0) ? 'danger' : 'neutral'} />)}</div><RegulatoryCard title="Add a candidate" subtitle="A candidate must reference a real source ID in your authorized scope."><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <RegulatoryField key={field.key} label={field.label}><input className={regulatoryInputClass()} value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /></RegulatoryField>)}</div><div className="mt-4 flex justify-end"><RegulatoryButton onClick={() => create.mutate(values)} disabled={Object.values(values).some((value) => !value) || create.isPending} title={Object.values(values).some((value) => !value) ? 'Complete every candidate field.' : undefined}>{create.isPending ? 'Adding...' : 'Add candidate'}</RegulatoryButton></div></RegulatoryCard><RegulatoryCard title={`Candidate register (${candidates.data?.total ?? 0})`}>{candidates.data?.rows.length ? <div className="space-y-2">{candidates.data.rows.map((candidate) => <div key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div><p className="font-semibold text-[var(--psm-fg)]">{candidate.candidate_title}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{candidate.candidate_type} - {candidate.source_module}</p></div><RegulatoryManagementReviewReadinessBadge value={candidate.readiness_status} /></div>)}</div> : <RegulatoryEmptyState title="No management review candidates" message="Create candidates from real critical gaps, repeat gaps, stale records, actions, or reports." />}</RegulatoryCard></div></RegulatoryLayout>;
}

export function RegulatoryKpiFeedPage() {
  const query = useRegulatoryKpiFeed();
  const mutations = useRegulatoryTrendMutations();
  if (query.isLoading) return <RegulatoryLayout current="Management Review Readiness"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Management Review Readiness"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data ?? {};
  const metrics = (data.metrics ?? {}) as Record<string, unknown>;
  return <RegulatoryLayout current="Management Review Readiness"><div className="space-y-5"><RegulatoryHeader title="Executive KPI Feed Foundation" subtitle="Aggregate-only regulatory metrics for a future KPI dashboard. Restricted source records are never exposed here." onRefresh={() => query.refetch()} action={<RegulatoryButton onClick={() => mutations.generateKpi.mutate({})} disabled={mutations.generateKpi.isPending}>{mutations.generateKpi.isPending ? 'Generating...' : 'Generate snapshot'}</RegulatoryButton>} /><RegulatoryCard title={data.ready ? 'KPI feed ready' : 'KPI feed blocked'} subtitle={`Source records included: ${Number(data.sourceRecordCount ?? 0)}. Aggregate-only: ${data.aggregateOnly ? 'Yes' : 'No'}.`}><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(metrics).map(([key, value]) => <RegulatoryMetricCard key={key} label={key.replace(/([A-Z])/g, ' $1')} value={Number(value ?? 0)} />)}</div></RegulatoryCard></div></RegulatoryLayout>;
}
