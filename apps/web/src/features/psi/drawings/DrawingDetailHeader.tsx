import { AsBuiltStatusBadge } from '../shared/AsBuiltStatusBadge';
import { CurrentApprovedBadge } from '../shared/CurrentApprovedBadge';
import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { DrawingCompletenessBadge } from '../shared/DrawingCompletenessBadge';
import { DrawingConflictBadge } from '../shared/DrawingConflictBadge';
import { DrawingStatusBadge } from '../shared/DrawingStatusBadge';
import { DrawingTypeBadge } from '../shared/DrawingTypeBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PsiButton, PsiCard } from '../shared/PsiUi';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import type { DrawingDetail } from '../types/drawing.types';

export function DrawingDetailHeader({ detail, busy, onRunCompleteness, onRunConflict, onSubmitReview }: { detail: DrawingDetail; busy: boolean; onRunCompleteness: () => void; onRunConflict: () => void; onSubmitReview: () => void }) {
  const drawing = detail.drawing;
  return (
    <PsiCard title={`${drawing.drawing_number} - ${drawing.drawing_title}`} subtitle="PSI drawing detail, current approved status, linked Document Control revision, tag index, MOC/redline, as-built verification, completeness, conflicts, and history.">
      <div className="flex flex-wrap gap-2">
        <DrawingTypeBadge value={drawing.drawing_type} />
        <DrawingStatusBadge value={drawing.status} />
        <DocumentStatusBadge value={drawing.document_status ?? null} />
        <CurrentApprovedBadge value={drawing.current_approved} />
        <AsBuiltStatusBadge verified={drawing.as_built_verified} required={drawing.as_built_required ?? null} />
        <DrawingCompletenessBadge value={drawing.completeness_status} score={drawing.completeness_score ?? null} />
        <DrawingConflictBadge value={drawing.conflict_status} />
        <MocRequiredBadge value={drawing.moc_update_required} />
        <PssrBlockerBadge value={drawing.pssr_blocker} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PsiButton href={`/process-safety-information/drawings/${drawing.id}/edit`} variant="secondary">Edit Metadata</PsiButton>
        <PsiButton onClick={onRunCompleteness} disabled={busy} title={busy ? 'A drawing action is already running.' : undefined}>Run Completeness</PsiButton>
        <PsiButton onClick={onRunConflict} disabled={busy} title={busy ? 'A drawing action is already running.' : undefined}>Run Conflict Check</PsiButton>
        <PsiButton onClick={onSubmitReview} disabled={busy || detail.actions.find((action) => action.key === 'submit-review')?.enabled === false} title={detail.actions.find((action) => action.key === 'submit-review')?.disabledReason ?? undefined}>Submit Review</PsiButton>
      </div>
    </PsiCard>
  );
}
