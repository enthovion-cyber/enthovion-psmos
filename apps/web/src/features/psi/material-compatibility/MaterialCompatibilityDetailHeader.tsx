import { CompatibilityRatingBadge, MaterialCompletenessBadge, MaterialConflictBadge, MiReadinessImpactBadge, MocRequiredBadge, PssrBlockerBadge } from '../shared/MaterialCompatibilityBadges';
import { PsiButton, PsiCard } from '../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../types/material-compatibility.types';

export function MaterialCompatibilityDetailHeader({ detail, busy, onRunCompatibilityCheck, onRunCompleteness, onRunConflict, onSubmitReview }: { detail: MaterialCompatibilityDetail; busy?: boolean; onRunCompatibilityCheck: () => void; onRunCompleteness: () => void; onRunConflict: () => void; onSubmitReview: () => void }) {
  const row = detail.compatibility;
  return (
    <PsiCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Material Compatibility</p>
          <h1 className="mt-1 text-2xl font-bold">{row.compatibility_record_number || row.compatibility_title}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{row.chemical_name || detail.serviceConditions?.chemical_name || row.chemical_id || 'Chemical missing'} to {row.material_family || detail.materialDetails?.material_family || 'material missing'} - {row.component_type || 'component missing'}</p>
          <div className="mt-3 flex flex-wrap gap-2"><CompatibilityRatingBadge value={row.compatibility_rating} /><MaterialCompletenessBadge value={row.completeness_status} score={row.completeness_score} /><MaterialConflictBadge value={row.conflict_status} /><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /><MiReadinessImpactBadge value={row.mi_readiness_impact} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/material-compatibility/${row.id}/edit`} variant="secondary">Edit</PsiButton>
          <PsiButton variant="secondary" onClick={onRunCompatibilityCheck} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Compatibility</PsiButton>
          <PsiButton variant="secondary" onClick={onRunCompleteness} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Completeness</PsiButton>
          <PsiButton variant="secondary" onClick={onRunConflict} disabled={busy} title={busy ? 'Action running.' : undefined}>Run Conflicts</PsiButton>
          <PsiButton onClick={onSubmitReview} disabled={busy} title={busy ? 'Action running.' : undefined}>Submit Review</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}

