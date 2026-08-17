import { DrawingCompletenessBadge } from '../shared/DrawingCompletenessBadge';
import { PsiCard } from '../shared/PsiUi';
import type { DrawingCheck } from '../types/drawing.types';

export function DrawingCompletenessPanel({ checks }: { checks: DrawingCheck[] }) {
  return (
    <PsiCard title="Completeness Checks" subtitle="Backend-generated checks for current approved PFD/P&ID, Document Control link, review schedule, redlines, MOC updates, as-built, tag mismatches, and conflicts.">
      {!checks.length ? <p className="text-sm text-[var(--psm-muted)]">No completeness check has been run yet.</p> : <div className="grid gap-3 md:grid-cols-2">{checks.map((check) => <div key={check.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex items-center justify-between gap-2"><p className="font-medium">{check.check_title}</p><DrawingCompletenessBadge value={check.status} /></div><p className="mt-1 text-xs text-[var(--psm-muted)]">{check.message ?? 'Complete'}</p>{check.pssr_blocker ? <p className="mt-2 text-xs font-semibold text-danger">PSSR blocker</p> : null}</div>)}</div>}
    </PsiCard>
  );
}
