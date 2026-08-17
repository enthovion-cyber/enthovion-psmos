import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingChangeHistoryTab({ detail }: { detail: DrawingDetail }) {
  return <PsiCard title="Change History" subtitle="Immutable PSI drawing history events created by create, update, link/unlink, import/export, check, submit, archive, as-built, and MOC/redline actions.">{!detail.history.length ? <p className="text-sm text-[var(--psm-muted)]">No drawing history yet.</p> : <div className="space-y-3">{detail.history.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{event.event_title}</p><p className="text-sm text-[var(--psm-muted)]">{event.event_description ?? event.event_type}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{new Date(event.created_at).toLocaleString()}</p></div>)}</div>}</PsiCard>;
}
