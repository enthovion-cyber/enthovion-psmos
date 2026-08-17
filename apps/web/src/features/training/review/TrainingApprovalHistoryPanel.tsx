import { TrainingCard } from '../shared/TrainingUi';
export function TrainingApprovalHistoryPanel({ rows }: { rows?: any[] | undefined }) {
  return <TrainingCard title="History" subtitle="Immutable Training approval history and audit-aligned events."><div className="space-y-2">{rows?.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{row.event_title}</p><p className="text-xs text-[var(--psm-muted)]">{row.event_type} / {row.actor_user_id ?? 'System'} / {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No history events returned.</p>}</div></TrainingCard>;
}
