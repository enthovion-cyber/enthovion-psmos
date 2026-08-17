'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import type { RequiredTrainingDetailResponse } from '../types/required-training.types';
import { useRequiredTrainingDetail } from '../hooks/useRequiredTrainingDetail';
import { useRequiredTrainingAction } from '../hooks/useRequiredTrainingMutations';
import { RequiredTrainingStatusBadge } from '../shared/RequiredTrainingStatusBadge';
import { TrainingDocumentStatusBadge } from '../shared/TrainingDocumentStatusBadge';
import { TrainingEvidencePolicyBadge } from '../shared/TrainingEvidencePolicyBadge';
import { TrainingMatrixSyncStatusBadge } from '../shared/TrainingMatrixSyncStatusBadge';
import { TrainingReviewStatusBadge } from '../shared/TrainingReviewStatusBadge';
import { TrainingVersionBadge } from '../shared/TrainingVersionBadge';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState, TrainingMetricCard, TrainingProgress } from '../shared/TrainingUi';

export function RequiredTrainingDetailPage({ tab = 'overview' }: { tab?: string }) {
  const params = useParams<{ trainingId: string }>();
  const trainingId = params.trainingId;
  const query = useRequiredTrainingDetail(trainingId);
  const submitReview = useRequiredTrainingAction(trainingId, 'submitReview');
  const approve = useRequiredTrainingAction(trainingId, 'approve');
  const activate = useRequiredTrainingAction(trainingId, 'activate');
  const syncMatrix = useRequiredTrainingAction(trainingId, 'syncToMatrix');
  const syncCompetency = useRequiredTrainingAction(trainingId, 'syncToCompetencyProfiles');
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return <TrainingEmptyState title="Required training not found" message="The backend did not return a required training detail record." />;
  const data = query.data;
  const readOnlyReason = ['Approved Current', 'Superseded', 'Archived'].includes(data.item.status) ? 'Approved/current or archived required training is read-only unless a new version or controlled edit is created.' : '';
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Required Training</p>
          <h1 className="mt-2 text-3xl font-bold">{data.item.training_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2"><RequiredTrainingStatusBadge value={data.item.status} /><TrainingReviewStatusBadge value={data.item.review_status} /><TrainingVersionBadge value={data.item.version} /><TrainingEvidencePolicyBadge value={data.item.evidence_policy_status} /><TrainingDocumentStatusBadge value={data.item.document_status} /></div>
          {readOnlyReason ? <p className="mt-2 text-sm text-warning">{readOnlyReason}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingButton href={`/training-competency/required-training/library/${trainingId}/edit`} variant="secondary" disabled={Boolean(readOnlyReason)} title={readOnlyReason}>Edit</TrainingButton>
          <TrainingButton onClick={() => submitReview.mutate({ reason: 'Submitted from Required Training detail.' })} disabled={submitReview.isPending} title={submitReview.isPending ? 'Review submission is running.' : ''}>Submit Review</TrainingButton>
          <TrainingButton onClick={() => approve.mutate({ reason: 'Approved from Required Training detail.' })} disabled={approve.isPending} title={approve.isPending ? 'Approval is running.' : ''}>Approve</TrainingButton>
          <TrainingButton onClick={() => activate.mutate({})} disabled={activate.isPending || data.readiness.status === 'Blocked'} title={data.readiness.status === 'Blocked' ? data.readiness.blockers.map((b) => b.message).join('; ') : ''}>Activate</TrainingButton>
          <TrainingButton href="/training-competency/required-training/library" variant="secondary">Library</TrainingButton>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        {tabs(trainingId).map((item) => <Link key={item.key} href={item.href} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.key ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{item.label}</Link>)}
      </div>
      {tab === 'overview' ? <Overview data={data} /> : null}
      {tab === 'content' ? <RecordList title="Content Outline" rows={data.content} columns={['section_order', 'section_title', 'summary', 'learning_outcome', 'linked_sop_id', 'linked_psi_module', 'required']} /> : null}
      {tab === 'delivery' ? <KeyValuePanel title="Delivery / Frequency Rules" row={data.deliveryRules} /> : null}
      {tab === 'evidence' ? <KeyValuePanel title="Evidence / Verification Rules" row={data.evidenceRules} /> : null}
      {tab === 'applicability' ? <RecordList title="Scope / Applicability" rows={data.applicability} columns={['scope_type', 'site_scope_id', 'department_id', 'unit_id', 'area_id', 'equipment_id', 'worker_type_filter', 'job_role_filter', 'ptw_role_filter', 'sop_id', 'psi_module', 'moc_trigger_type', 'pssr_trigger_type']} /> : null}
      {tab === 'matrix' ? <SyncPanel title="Matrix Links" rows={data.matrixLinks} columns={['matrix_rule_code', 'matrix_rule_title', 'link_status', 'sync_status']} onSync={() => syncMatrix.mutate({})} isSaving={syncMatrix.isPending} /> : null}
      {tab === 'competency' ? <SyncPanel title="Competency Links" rows={data.competencyLinks} columns={['competency_code', 'competency_title', 'link_status', 'sync_status']} onSync={() => syncCompetency.mutate({})} isSaving={syncCompetency.isPending} /> : null}
      {tab === 'documents' ? <RecordList title="Controlled Documents" rows={data.documents} columns={['document_number', 'document_title', 'document_type', 'document_status', 'revision', 'controlled', 'required_document']} /> : null}
      {tab === 'versions' ? <RecordList title="Version History" rows={data.versionHistory} columns={['version', 'version_number', 'version_type', 'change_reason', 'created_by', 'created_at']} /> : null}
      {tab === 'history' ? <RecordList title="Change History" rows={data.history} columns={['event_type', 'event_title', 'event_description', 'actor_user_id', 'created_at']} /> : null}
    </div>
  );
}

function Overview({ data }: { data: RequiredTrainingDetailResponse }) {
  const complete = data.readiness.status === 'Complete' ? 100 : data.readiness.status === 'Warning' ? 65 : 35;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <TrainingMetricCard label="Content Sections" value={data.summary.contentSections ?? 0} />
        <TrainingMetricCard label="Matrix Links" value={data.summary.matrixLinks ?? 0} />
        <TrainingMetricCard label="Competency Links" value={data.summary.competencyLinks ?? 0} />
        <TrainingMetricCard label="Documents" value={data.summary.linkedDocuments ?? 0} />
        <TrainingMetricCard label="Usage Count" value={data.item.usage_count ?? 0} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <TrainingCard title="Readiness / Missing Data" subtitle="Backend-generated blockers for active/current library use.">
          <div className="mb-3 flex items-center justify-between"><b>{data.readiness.status}</b><span>{complete}%</span></div><TrainingProgress value={complete} />
          {!data.readiness.blockers.length ? <p className="mt-3 text-sm text-success">No readiness blockers returned by backend.</p> : <div className="mt-3 space-y-2">{data.readiness.blockers.map((b) => <div key={b.code} className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"><b>{b.severity}</b>: {b.message}</div>)}</div>}
        </TrainingCard>
        <KeyValuePanel title="Training Identity" row={data.item} compact />
        <TrainingCard title="Sync / Document Status">
          <div className="space-y-3"><Line label="Matrix" value={<TrainingMatrixSyncStatusBadge value={data.item.matrix_sync_status} />} /><Line label="Competency" value={<TrainingMatrixSyncStatusBadge value={data.item.competency_sync_status} />} /><Line label="Evidence" value={<TrainingEvidencePolicyBadge value={data.item.evidence_policy_status} />} /><Line label="Documents" value={<TrainingDocumentStatusBadge value={data.item.document_status} />} /></div>
        </TrainingCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RecordList title="Recent Content" rows={data.content.slice(0, 5)} columns={['section_order', 'section_title', 'summary', 'required']} />
        <RecordList title="Recent Change History" rows={data.history.slice(0, 5)} columns={['event_type', 'event_title', 'created_at']} />
      </div>
    </div>
  );
}

function SyncPanel({ title, rows, columns, onSync, isSaving }: { title: string; rows: Record<string, any>[]; columns: string[]; onSync: () => void; isSaving?: boolean | undefined }) {
  return <TrainingCard title={title} action={<TrainingButton onClick={onSync} disabled={Boolean(isSaving)} title={isSaving ? 'Sync already running.' : ''}>{isSaving ? 'Syncing...' : 'Sync'}</TrainingButton>}><RecordList rows={rows} columns={columns} /></TrainingCard>;
}

function RecordList({ title, rows, columns }: { title?: string; rows: Record<string, any>[]; columns: string[] }) {
  const body = !rows.length ? <TrainingEmptyState title="No records" message="No backend records exist for this section in the current scope." /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase text-[var(--psm-muted)]"><tr>{columns.map((c) => <th key={c} className="px-2 py-2">{c.replace(/_/g, ' ')}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index} className="border-t border-[var(--psm-line)]">{columns.map((c) => <td key={c} className="max-w-xs px-2 py-2 align-top">{formatValue(row[c])}</td>)}</tr>)}</tbody></table></div>;
  return title ? <TrainingCard title={title}>{body}</TrainingCard> : body;
}

function KeyValuePanel({ title, row, compact }: { title: string; row?: Record<string, any> | null; compact?: boolean }) {
  if (!row) return <TrainingCard title={title}><TrainingEmptyState title="No data" message="The backend did not return data for this panel." /></TrainingCard>;
  const entries = Object.entries(row).filter(([, value]) => value !== null && value !== undefined && value !== '').slice(0, compact ? 12 : 80);
  return <TrainingCard title={title}><div className="grid gap-2 md:grid-cols-2">{entries.map(([key, value]) => <Line key={key} label={key.replace(/_/g, ' ')} value={formatValue(value)} />)}</div></TrainingCard>;
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}

function formatValue(value: any) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value ?? 'Not set';
}

function tabs(trainingId: string): Array<{ key: string; label: string; href: string }> {
  const items: Array<[string, string, string]> = [
    ['overview', 'Overview', `/training-competency/required-training/library/${trainingId}`],
    ['content', 'Content Outline', `/training-competency/required-training/library/${trainingId}/content`],
    ['delivery', 'Delivery / Frequency', `/training-competency/required-training/library/${trainingId}/evidence-rules`],
    ['evidence', 'Evidence / Verification', `/training-competency/required-training/library/${trainingId}/evidence-rules`],
    ['applicability', 'Scope / Applicability', `/training-competency/required-training/library/${trainingId}/applicability`],
    ['matrix', 'Matrix Links', `/training-competency/required-training/library/${trainingId}/matrix-links`],
    ['competency', 'Competency Links', `/training-competency/required-training/library/${trainingId}/competency-links`],
    ['documents', 'Documents', `/training-competency/required-training/library/${trainingId}/documents`],
    ['versions', 'Version History', `/training-competency/required-training/library/${trainingId}/version-history`],
    ['history', 'Change History', `/training-competency/required-training/library/${trainingId}/version-history`]
  ];
  return items.map(([key, label, href]) => ({ key, label, href }));
}
