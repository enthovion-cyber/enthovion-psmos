import { RegulatoryCard } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';

export function ComplianceHistoryTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const rows = detail?.history?.rows ?? [];
  return <RegulatoryCard title="Compliance History">{rows.length ? <div className="space-y-2">{rows.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><b>{event.event_title ?? event.event_type}</b><div className="text-[var(--psm-muted)]">{event.event_description ?? 'No description'} · {event.created_at ? new Date(event.created_at).toLocaleString() : 'No timestamp'}</div></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No compliance history events returned.</p>}</RegulatoryCard>;
}
