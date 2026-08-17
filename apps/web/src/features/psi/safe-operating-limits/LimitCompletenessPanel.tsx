import { LimitCompletenessBadge } from '../shared/LimitCompletenessBadge';
import { PsiCard } from '../shared/PsiUi';

export function LimitCompletenessPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <PsiCard title="Completeness Engine" subtitle="Backend-generated checks for unit, parameter, values, consequences, responses, safeguards, documents, owner, review, conflicts, and integration basis.">
      {!rows.length ? <p className="text-sm text-[var(--psm-muted)]">No completeness evaluation has been run yet.</p> : <div className="space-y-2">{rows.map((row) => <div key={String(row.id ?? row.check_key)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div><p className="font-semibold">{String(row.check_title ?? row.check_key)}</p><p className="text-sm text-[var(--psm-muted)]">{String(row.message ?? row.missing_reason ?? '')}</p></div><div className="flex items-center gap-2"><LimitCompletenessBadge status={String(row.status ?? 'Not Reviewed')} />{row.pssr_blocker ? <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">PSSR blocker</span> : null}</div></div>)}</div>}
    </PsiCard>
  );
}
