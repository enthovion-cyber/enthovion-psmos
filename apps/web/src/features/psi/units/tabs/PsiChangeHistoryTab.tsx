import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';

export function PsiChangeHistoryTab({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return <PsiCard title="Change History Foundation" subtitle="Immutable PSI history events plus shared audit log hooks.">{rows.length ? <div className="space-y-3">{rows.map((event) => <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{String(event.event_title)}</p><p className="text-sm text-[var(--psm-muted)]">{String(event.event_description ?? event.event_type)} - {event.created_at ? new Date(String(event.created_at)).toLocaleString() : ''}</p></div>)}</div> : <PsiEmptyState title="No PSI history events" message="History appears after unit/profile/link/review/completeness mutations." />}</PsiCard>;
}
