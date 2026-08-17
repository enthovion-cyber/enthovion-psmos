import { LimitConflictBadge } from '../shared/LimitConflictBadge';
import { PsiCard } from '../shared/PsiUi';

export function LimitConflictPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <PsiCard title="Conflict Validation Engine" subtitle="Backend range, design, equipment/process chemistry, duplicate tag, and override status checks.">
      {!rows.length ? <p className="text-sm text-[var(--psm-muted)]">No conflict validation has been run yet.</p> : <div className="space-y-2">{rows.map((row) => <div key={String(row.id ?? row.conflict_type)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{String(row.conflict_type)}</p><LimitConflictBadge status={String(row.conflict_status ?? 'Not Reviewed')} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{String(row.message ?? '')}</p>{row.override_required ? <p className="mt-2 text-xs font-semibold text-warning">Override requires permission, reason, audit/history, and e-signature if configured.</p> : null}</div>)}</div>}
    </PsiCard>
  );
}
