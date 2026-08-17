import { DrawingConflictBadge } from '../shared/DrawingConflictBadge';
import { PsiCard } from '../shared/PsiUi';
import type { DrawingConflict } from '../types/drawing.types';

export function DrawingConflictPanel({ conflicts }: { conflicts: DrawingConflict[] }) {
  return (
    <PsiCard title="Conflict / Consistency Validation" subtitle="Backend validation against Document Control status, MOC updates, redlines, as-built state, tag mismatches, PSSR readiness, and relationship consistency.">
      {!conflicts.length ? <p className="text-sm text-[var(--psm-muted)]">No conflicts are currently recorded.</p> : <div className="space-y-3">{conflicts.map((conflict) => <div key={conflict.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{conflict.conflict_type}</p><DrawingConflictBadge value={conflict.conflict_status} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{conflict.message}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">{conflict.compared_module ?? 'PSI Drawings'} {conflict.compared_record_id ?? ''}</p></div>)}</div>}
    </PsiCard>
  );
}
