import { DesignBasisCompletenessBadge } from '../shared/DesignBasisCompletenessBadge';
import { DesignBasisConflictBadge } from '../shared/DesignBasisConflictBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';
import { EquipmentDesignStatusBadge } from '../shared/EquipmentDesignStatusBadge';
import { MiReadinessImpactBadge } from '../shared/MiReadinessImpactBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { PsiButton, PsiCard } from '../shared/PsiUi';
import type { EquipmentDesignDetail } from '../types/equipment-design.types';

export function EquipmentDesignDetailHeader({ detail, onRunCompleteness, onRunConflict, onCompareMi, onSubmitReview, busy }: { detail: EquipmentDesignDetail; onRunCompleteness: () => void; onRunConflict: () => void; onCompareMi: () => void; onSubmitReview: () => void; busy?: boolean | undefined }) {
  const basis = detail.designBasis;
  const actionReason = (key: string) => detail.actions.find((action) => action.key === key)?.disabledReason ?? undefined;
  return (
    <PsiCard>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Equipment Design Basis</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{basis.equipment_tag} - {basis.equipment_name}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">Unit {basis.unit_id} · {basis.equipment_type} · {basis.system_service ?? 'No service specified'} · Last updated {basis.updated_at ? new Date(basis.updated_at).toLocaleString() : 'Not recorded'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <EquipmentDesignStatusBadge value={basis.status} />
            <EquipmentCriticalityBadge value={basis.equipment_criticality} />
            <DesignBasisCompletenessBadge value={basis.completeness_status} score={basis.completeness_score ?? null} />
            <DesignBasisConflictBadge value={basis.conflict_status} />
            <MocRequiredBadge value={basis.moc_update_required} />
            <PssrBlockerBadge value={basis.pssr_blocker} />
            <MiReadinessImpactBadge value={basis.mi_readiness_impact} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/equipment-design/${basis.id}/edit`} variant="secondary">Edit</PsiButton>
          <PsiButton onClick={onCompareMi} disabled={busy} variant="secondary" title={busy ? 'A design basis action is already running.' : actionReason('sync_mi')}>Compare MI</PsiButton>
          <PsiButton onClick={onRunCompleteness} disabled={busy} variant="secondary" title={busy ? 'A design basis action is already running.' : actionReason('run_completeness_check')}>Run Completeness</PsiButton>
          <PsiButton onClick={onRunConflict} disabled={busy} variant="secondary" title={busy ? 'A design basis action is already running.' : actionReason('run_conflict_check')}>Run Conflict</PsiButton>
          <PsiButton onClick={onSubmitReview} disabled={busy} title={busy ? 'A design basis action is already running.' : actionReason('submit_review')}>Submit Review</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
