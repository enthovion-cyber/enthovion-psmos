'use client';

import { PsiButton, PsiCard } from '../shared/PsiUi';
import { ElectricalClassificationBadge } from '../components/shared/ElectricalClassificationBadge';
import { ElectricalCompletenessBadge } from '../components/shared/ElectricalCompletenessBadge';
import { ElectricalConflictBadge } from '../components/shared/ElectricalConflictBadge';
import type { ElectricalDetail } from '../types/electrical-classification.types';

export function ElectricalClassificationDetailHeader({ detail, busy, onRunRatingCheck, onRunCompleteness, onRunConflict, onSubmitReview }: { detail: ElectricalDetail; busy?: boolean; onRunRatingCheck: () => void; onRunCompleteness: () => void; onRunConflict: () => void; onSubmitReview: () => void }) {
  const row = detail.classification;
  return (
    <PsiCard title={row.classification_title} subtitle={`${row.classification_record_number || row.id} - ${row.classification_system} - ${row.building_location || row.area_id || 'Area missing'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2"><ElectricalClassificationBadge value={row.classification_status} /><ElectricalCompletenessBadge value={row.completeness_status} score={row.completeness_score} /><ElectricalConflictBadge value={row.conflict_status} />{row.moc_update_required ? <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">MOC required</span> : null}{row.pssr_blocker ? <span className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">PSSR blocker</span> : null}</div>
        <div className="flex flex-wrap gap-2"><PsiButton href={`/process-safety-information/electrical-classification/${row.id}/edit`} variant="secondary">Edit</PsiButton><PsiButton variant="secondary" onClick={onRunRatingCheck} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Rating</PsiButton><PsiButton variant="secondary" onClick={onRunCompleteness} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Completeness</PsiButton><PsiButton variant="secondary" onClick={onRunConflict} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Conflicts</PsiButton><PsiButton onClick={onSubmitReview} disabled={busy} title={busy ? 'Action running.' : undefined}>Submit Review</PsiButton></div>
      </div>
    </PsiCard>
  );
}
