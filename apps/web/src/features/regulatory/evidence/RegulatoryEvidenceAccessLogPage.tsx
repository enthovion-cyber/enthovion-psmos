'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceAccessLog } from '../hooks/useRegulatoryEvidenceAccessLog';

export function RegulatoryEvidenceAccessLogPage() {
  const query = useRegulatoryEvidenceAccessLog({ limit: 100 });
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const rows = query.data?.rows ?? [];
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="Evidence Access Log" subtitle="Read-only access audit for evidence view, preview, download, denial, and redaction events." onRefresh={() => query.refetch()} action={null} />{rows.length ? <RegulatoryCard title="Access Events"><div className="space-y-3">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><b>{row.access_type}</b> · {row.access_status}<div className="text-[var(--psm-muted)]">Evidence: {row.evidence_link_id} · By: {row.accessed_by ?? 'System'} · {row.accessed_at ? new Date(row.accessed_at).toLocaleString() : ''}</div>{row.denied_reason ? <div className="text-danger">{row.denied_reason}</div> : null}</div>)}</div></RegulatoryCard> : <RegulatoryEmptyState title="No access events" message="No evidence access events have been recorded in this scope." />}</div></RegulatoryLayout>;
}
