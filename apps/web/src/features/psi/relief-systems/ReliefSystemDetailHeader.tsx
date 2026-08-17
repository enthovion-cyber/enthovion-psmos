import { PsiButton, PsiCard, PsiProgress } from '../shared/PsiUi';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { ReliefCompletenessBadge } from '../shared/ReliefCompletenessBadge';
import { ReliefConflictBadge } from '../shared/ReliefConflictBadge';
import { ReliefDeviceStatusBadge } from '../shared/ReliefDeviceStatusBadge';
import { ReliefSystemTypeBadge } from '../shared/ReliefSystemTypeBadge';
import type { ReliefSystemDetail } from '../types/relief-system.types';

export function ReliefSystemDetailHeader({ detail, busy, onRunCompleteness, onRunConflict, onCompareMi, onSubmitReview }: { detail: ReliefSystemDetail; busy: boolean; onRunCompleteness: () => void; onRunConflict: () => void; onCompareMi: () => void; onSubmitReview: () => void }) {
  const basis = detail.reliefBasis;
  const disabledReason = busy ? 'A relief system action is already running.' : undefined;
  return (
    <PsiCard title={basis.relief_basis_title} subtitle={`${basis.protected_equipment_tag} / ${basis.protected_equipment_name} / ${basis.service_fluid ?? 'No service fluid'}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <ReliefSystemTypeBadge value={basis.relief_system_type} />
          <ReliefDeviceStatusBadge value={basis.relief_device_status ?? (basis.mi_relief_device_id ? 'Linked' : 'Not linked')} />
          <ReliefCompletenessBadge value={basis.completeness_status} score={basis.completeness_score ?? null} />
          <ReliefConflictBadge value={basis.conflict_status} />
          <MocRequiredBadge value={basis.moc_update_required} />
          <PssrBlockerBadge value={basis.pssr_blocker} />
        </div>
        <PsiProgress value={basis.completeness_score ?? 0} />
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/relief-systems/${basis.id}/edit`} variant="secondary">Edit</PsiButton>
          <PsiButton variant="secondary" disabled={busy} title={disabledReason} onClick={onRunCompleteness}>Run Completeness</PsiButton>
          <PsiButton variant="secondary" disabled={busy} title={disabledReason} onClick={onRunConflict}>Run Conflict Check</PsiButton>
          <PsiButton variant="secondary" disabled={busy} title={disabledReason} onClick={onCompareMi}>Compare MI</PsiButton>
          <PsiButton disabled={busy} title={disabledReason} onClick={onSubmitReview}>Submit Review</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
