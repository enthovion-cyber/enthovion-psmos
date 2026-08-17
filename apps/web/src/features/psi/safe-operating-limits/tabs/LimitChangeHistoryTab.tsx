import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { SafeOperatingLimitDetail } from '../../types/safe-operating-limit.types';

export function LimitChangeHistoryTab({ detail }: { detail: SafeOperatingLimitDetail }) {
  return <PsiCard title="Change History" subtitle="Immutable SOL history events plus audit log integration created by backend mutations.">{!detail.history.length ? <PsiEmptyState title="No history events" message="Create, edit, link, unlink, check, review, import, export, and archive actions will appear here." /> : <div className="space-y-3">{detail.history.map((row) => <article key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{String(row.event_title)}</h3><span className="text-xs text-[var(--psm-muted)]">{row.created_at ? new Date(String(row.created_at)).toLocaleString() : ''}</span></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{String(row.event_description ?? row.event_type ?? '')}</p></article>)}</div>}</PsiCard>;
}
