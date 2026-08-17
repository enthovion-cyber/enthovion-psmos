'use client';

import { useExpiryOverdue } from '../hooks/useExpiryOverdue';
import { ExpiryOverdueBadge } from '../shared/ExpiryOverdueBadge';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../shared/TrainingUi';

export function ExpiryOverduePage() {
  const query = useExpiryOverdue();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data as Record<string, any> | undefined;
  const summary = data?.summary ?? {};
  const certs = data?.certificateRows ?? [];
  const assignments = data?.assessmentRows ?? [];
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold">Expiry / Overdue</h1><p className="text-sm text-[var(--psm-muted)]">Combined certificate expiry, overdue assessments, and PTW/MOC/PSSR blocker evidence.</p></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><TrainingMetricCard label="Total Overdue" value={summary.totalOverdue ?? 0} tone="danger" /><TrainingMetricCard label="Certificates Expiring" value={summary.certificatesExpiring ?? 0} tone="warn" /><TrainingMetricCard label="Certificates Expired" value={summary.certificatesExpired ?? 0} tone="danger" /><TrainingMetricCard label="Assessments Overdue" value={summary.assessmentsOverdue ?? 0} tone="danger" /></div><div className="grid gap-4 xl:grid-cols-2"><ExpiryList title="Certificate Expiry" rows={certs} kind="certificate" /><ExpiryList title="Assessment Overdue" rows={assignments} kind="assessment" /></div></div>;
}

function ExpiryList({ title, rows, kind }: { title: string; rows: Array<Record<string, unknown>>; kind: 'certificate' | 'assessment' }) {
  return <TrainingCard title={title}>{rows.length ? <div className="space-y-2 text-sm">{rows.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><b>{String(row.certificate_title ?? row.assessment_id ?? row.id)}</b><ExpiryOverdueBadge status={String(row.runtime_status ?? row.certificate_status ?? 'Overdue')} /></div><p className="text-xs text-[var(--psm-muted)]">{kind === 'certificate' ? `Expires ${String(row.expiry_date ?? 'missing')}` : `Due ${String(row.due_date ?? 'missing')}`} - worker {String(row.worker_id ?? 'Unknown')}</p></div>)}</div> : <TrainingEmptyState title="No overdue records" message="No certificate or assessment expiry items are currently returned by the backend." />}</TrainingCard>;
}
