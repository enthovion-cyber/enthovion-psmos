import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { SafeguardDetail } from '../../types/safeguard.types';

export function SafeguardChangeHistoryTab({ detail }: { detail: SafeguardDetail }) {
  return <PsiCard title="Change History" subtitle="Immutable PSI Safeguards / Controls history events with before/after values and audit linkage where available.">{!detail.history.length ? <PsiEmptyState title="No history events" message="Create, update, link, unlink, import, export, submit, approve/reject, archive, status checks, completeness, and conflict operations create history." /> : <div className="space-y-2">{detail.history.map((event) => <article key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{event.event_title}</p><p className="text-sm text-[var(--psm-muted)]">{event.event_type} / {event.created_at ? new Date(event.created_at).toLocaleString() : 'Unknown time'}</p><p className="text-sm">{event.event_description ?? 'No description returned.'}</p></article>)}</div>}</PsiCard>;
}
