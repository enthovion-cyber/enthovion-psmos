import { PsiCard } from '../../shared/PsiUi';
import { DrawingCompletenessBadge } from '../../shared/DrawingCompletenessBadge';
import { DrawingConflictBadge } from '../../shared/DrawingConflictBadge';

export function DrawingCompletenessReviewSection({ completenessStatus, conflictStatus }: { completenessStatus?: string | null; conflictStatus?: string | null }) {
  return (
    <PsiCard title="7. Completeness / Review" subtitle="Backend will calculate completeness, conflicts, review blockers, PSSR blockers, and PSI history on save and on check actions.">
      <div className="flex flex-wrap gap-3">
        <DrawingCompletenessBadge value={completenessStatus ?? 'Not Reviewed'} />
        <DrawingConflictBadge value={conflictStatus ?? 'No Conflict'} />
      </div>
      <p className="mt-3 text-sm text-[var(--psm-muted)]">Approval is blocked when a required Document Control link is missing, a current-approved document is invalid, MOC updates are incomplete, as-built verification is required, or critical conflicts remain open.</p>
    </PsiCard>
  );
}
